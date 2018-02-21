const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//check id
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  db.get("SELECT * FROM Timesheet WHERE id = $timesheetId",
  {$timesheetId: timesheetId}, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//get timesheets
timesheetsRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Timesheet WHERE employee_id = $employeeId",
  {$employeeId: req.params.employeeId}, (error, rows) => {
    if (error) {
      next(error);
    } else {
      res.status(200).send({timesheets: rows});
    }
  });
});

//post new timesheets
const validateTimesheet = (req, res, next) => {
  if (!req.body.timesheet.hour || ! req.body.timesheet.rate || !req.body.timesheet.date) {
    return res.sendStatus(400);
  }
}

timesheetsRouter.post('/', validateTimesheet, (req, res, next) => {
  db.run("INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)",  {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId
      }, function(error) {
        if (error) {
          next(error);
        }
        db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
          (error, row) => {
            res.status(201).send({timesheet: row});
        });
  });
});

//update timesheet
timesheetsRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
  db.run("UPDATE Timesheet SET hours = $hours, rate = $rate,  date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId", {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId,
        $timesheetId: timesheetId
      }, function(error) {
        if (error) {
          next(error);
        }
        expressoDB.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
          (error, row) => {
            res.status(200).send({timesheet: row});
        });
    });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  db.run("DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId",
  {$timesheetId: req.params.timesheetId}, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;
