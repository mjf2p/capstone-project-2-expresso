const express = require('express');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheets.js')

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//check for employee id
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get("SELECT * FROM Employee WHERE id = $employeeId", {$employeeId: employeeId},
  (error, employee) => {
    if (error) {
      next(error);
    } else if (!employee) {
      res.sendStatus(404);
    } else {
      req.employee = employee;
      next();
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//get all employees
employeesRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE is_current_employee = 1",
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.status(200).send({employees: rows});
      }
    });
});

//get single employee
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).send({employee: req.employee});
});

//post new employee
const validateEmployee = (req, res, next) => {
  const newEmployee = req.body.employee;
  console.log(newEmployee);
  if (!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
    return res.sendStatus(400);
  }
  next();
};
employeesRouter.post('/', validateEmployee, (req, res, next) => {
  db.run("INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentlyEmployed)",
  {$name: req.body.employee.name, $position: req.body.employee.position,
    $wage: req.body.employee.wage, $isCurrentlyEmployed: req.body.employee.isCurrentlyEmployed}, function(err) {
      if (err) {
        return res.sendStatus(500);
      }
      db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, row) => {
        if (!row) {
          return res.sendStatus(500);
        }
        res.status(201).send({employee: row});
      });
    });
});

//update employee
employeesRouter.put('/:employeeId',  validateEmployee, (req, res, next) => {
  const employeeUpdate = req.body.employee;
  db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentlyEmployed WHERE id = $employeeId", {
      $name: req.body.employee.name,
      $position: req.body.employee.position,
      $wage: req.body.employee.wage,
      $isCurrentlyEmployed: req.body.employee.isCurrentlyEmployed,
      $employeeId: req.params.employeeId
    }, function(error, row) {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,
        (error, row) => {
          res.status(200).send({employee: row});
        });
      }
    });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = ${req.params.employeeId}`,
    function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,
        (error, row) => {
          res.status(200).send({employee: row});
        });
    }
  });
});


module.exports = employeesRouter;
