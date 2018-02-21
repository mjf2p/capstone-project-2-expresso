const express = require('express');
const menusRouter = express.Router();
const menuItemsRouter = require('./menu-items.js')

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//check id
menusRouter.param('menuId', (req, res, next, menuId) => {
  db.get("SELECT * FROM Menu WHERE id = $menuId", {$menuId: menuId},
  (error, menu) => {
    if (error) {
      next(error);
    } else if (!menu) {
      res.sendStatus(404);
    } else {
      req.menu = menu;
      next();
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

//get all menus
menusRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Menu", (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.status(200).send({menus: rows});
      }
    });
});

//get one menu
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).send({menu: req.menu});
});

//post new menu
const validateMenu = (req, res, next) => {
  if (!req.body.menu.title) {
    return res.sendStatus(400);
  }
  next();
};

//post new menu
menusRouter.post('/', validateMenu, (req, res, next) => {
  db.run("INSERT INTO Menu (title) VALUES ($title)", {$title: req.body.menu.title},
  function(error) {
    if (error) {
      next(error);
    }
    db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (error, row) => {
      res.status(201).send({menu: row});
    });
  });
});

//update existing menu
menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
  db.run("UPDATE Menu SET title = $title WHERE id = $menuId",
  {$title: req.body.menu.title, $menuId: req.params.menuId}, (error) => {
    if (error) {
      next(error);
    }
    db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
      (error, row) => {
        res.status(200).send({menu: row});
    });
  });
});

//delete menu
menusRouter.delete('/:menuId', (req, res, next) => {
  expressoDB.get("SELECT * FROM MenuItem WHERE menu_id = $menuId",
  {$menuId: req.params.menuId}, (error, menuItems) => {
    if (error) {
      next(error);
    } else if (menuItems) {
      res.sendStatus(400);
    } else {
      expressoDB.get("DELETE FROM Menu WHERE Menu.id = $menuId",
      {$menuId: req.params.menuId}, (error) => {
        if (error) {
          next(error);
        }
        res.status(204).send();
      });
    }
  });
});

module.exports = menusRouter;
