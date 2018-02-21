const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//check id
menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  db.get("SELECT * FROM MenuItem WHERE id = $menuItemId",
  {$menuItemId: menuItemId}, (error, menuitem) => {
    if (error) {
      next(error);
    } else if (menuitem) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//gets items by id
menuItemsRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM MenuItem WHERE menu_id = $menuId",
  {$menuId: req.params.menuId}, (error, rows) => {
    if (error) {
      next(error);
    } else {
      if (!rows) {
        res.status(200).send({});
      } else {
        res.status(200).send({menuItems: rows});
      }
    }
  });
});

//post new items
const validateMenuItem = (req, res, next) => {
  req.name = req.body.menuItem.name;
  req.inventory = req.body.menuItem.inventory;
  req.description = req.body.menuItem.description;
  req.price = req.body.menuItem.price;
  req.menuId = req.params.menuId;
  if (!req.name || !req.description || !req.price || !req.inventory) {
    return res.sendStatus(400);
  }
  next();
};

menuItemsRouter.post('/', validateMenuItem, (req, res, next) => {
  db.run("INSERT INTO MenuItem (name, inventory, description, price, menu_id) VALUES ($name, $inventory, $description, $price, $menuId)", {
        $name: name,
        $inventory: inventory,
        $description: description,
        $price: price,
        $menuId: req.params.menuId}, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
            (error, row) => {
              res.status(201).send({menuItem: row});
            });
        }
      });
});

//update existing
menuItemsRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
  db.run("UPDATE MenuItem SET name = $name, inventory = $inventory, menu_id = $menuId, description = $description, price = $price WHERE MenuItem.id = $menuItemId", {
        $name: name,
        $inventory: inventory,
        $description: description,
        $price: price,
        $menuId: menuId,
        $menuItemId: menuItemId
      }, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`,
            (error, row) => {
              res.status(200).send({menuItem: row});
            });
        }
      });
});

//delete
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
 db.run("DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId",
 {$menuItemId: req.params.menuItemId}, (error) => {
   if (error) {
     next(error);
   } else {
     res.sendStatus(204);
   }
 });
});

module.exports = menuItemsRouter;
