// *********************************************************************************
// api-routes.js - this file offers a set of routes for displaying and saving data to the db
// *********************************************************************************

// Dependencies
// =============================================================

// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");

// Routes
// =============================================================
module.exports = function(app) {
  
// PASSPORT AUTHENTICATION API ROUTES
// =============================================================
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    // Sending back a password, even a hashed password, isn't a good idea
    res.json({
      email: req.user.email,
      id: req.user.id
    });
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post("/api/signup", function(req, res) {
    db.Member.create({
      // memId: req.body.memId, // autoincrement PK
      mem_username: req.body.username,
      memFirstname: req.body.firstName,
      memLastname: req.body.lastName,
      credits: req.body.credits,
      memMobile: req.body.credits,
      memEmail: req.body.email,
      password: req.body.password
    })
      .then(function() {
        res.redirect(307, "/api/login");
      })
      .catch(function(err) {
        res.status(401).json(err);
      });
  });

  // Route for logging user out
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.memEmail, // changed to memEmail
        id: req.user.id
      });
    }
  });

// REGISTER DRIVER API ROUTE
// =============================================================

app.post("/api/registerDriver", function(req, res) {
  db.Driver.create({
    // driverId: req.body.driverId, // autoincrement PK
   
    defaultVehicle: req.body.defaultVehicle,
    stateOfIssue: req.body.stateOfIssue,
    expiryDate: req.body.expiryDate,
    yearsDriving: req.body.yearsDriving,
    workingWithChildren: req.body.workingWithChildren,
    defaultRoute: req.body.defaultRoute,
 
  })
    .then(function(dbDriver) {
      res.json(dbDriver)
      // res.redirect(307, "/api/login");
    })
    .catch(function(err) {
      res.status(401).json(err);
    });

    db.Vehicle.create({
      // driverId: req.body.driverId, // autoincrement PK
     
      registration: req.body.registration,
      make: req.body.make,
      model: req.body.model,
      color: req.body.color,
      spareSpots: req.body.spareSpots,
      spareChildSeats: req.body.spareChildSeats,
      spareBoosters: req.body.spareBoosters,
      petsEverTravel: req.body.spareChildSeats
    })
      .then(function(dbVehicle) {
        res.json(dbVehicle)
        // res.redirect(307, "/api/login");
      })
      .catch(function(err) {
        res.status(401).json(err);
      });

    db.Route.create({
      // driverId: req.body.driverId, // autoincrement PK
      
      routeName: req.body.routeName,
      startLocnId: req.body.startLocnId,
      endLocnId: req.body.endLocnId,
      routeDistance: req.body.routeDistance,
      routeTotalTime: req.body.routeTotalTime,
      routeStartTime: req.body.routeStartTime
    })
      .then(function(dbRoute) {
        res.json(dbRoute)
        // res.redirect(307, "/api/login");
      })
      .catch(function(err) {
        res.status(401).json(err);
      });
});

app.get("/api/drivers", function(req, res) {
  // Here we add an "include" property to our options in our findAll query
  // We set the value to an array of the models we want to include in a left outer join
  // In this case, just db.Driver
  db.Member.findAll({
    include: [db.Driver]
  }).then(function(dbDriver) {
    res.json(dbDriver);
  });
});

// CREATE REQUEST API ROUTE
// =============================================================


app.post("/api/createRequest", function(req, res) {
  db.Request.create({
    // driverId: req.body.driverId, // autoincrement PK
    requestDate: req.body.requestDate,
    requiredDate: req.body.requiredDate,
    requiredDropOffTimeStart: req.body.requiredDropOffTimeStart,
    requiredDropOffTimeEnd: req.body.requiredDropOffTimeEnd,
    requiredPickupLocnId: req.body.requiredPickupLocnId,
    requiredDropoffLocnId: req.body.requiredDropoffLocnId,
    addedRouteDistance: req.body.addedRouteDistance,
    addedRouteTime: req.body.addedRouteTime,
    boostersRequired: req.body.boostersRequired,
    carSeatsRequired: req.body.carSeatsRequired,
    creditsOffered: req.body.creditsOffered,
    booked: req.body.booked,
    bookedBy: req.body.bookedBy,
 
  })
    .then(function(dbRequest) {
      console.log("Request has been created");
      // res.json(dbRequest)
    })
    .catch(function(err) {
      res.status(401).json(err);
    });

    
  db.Member.findOne({
    include: [
      {
      model: db.Driver,
      where: { 
        expiryDate: { [Op.gt]: req.body.requiredDate }, 
        workingWithChildren: true 
      }
      },
      {
        model: db.Vehicle,
        where: {
          spareSpots: { [Op.gte]: 1 }, // sparespots should be atleast 1
          spareChildSeats : req.body.carSeatsRequired,
          spareBoosters : req.body.boostersRequired,
          addedRouteTime : req.body.addedRouteTime,
          boostersRequired : req.body.boostersRequired,
          carSeatsRequired : req.body.carSeatsRequired, 
        }
      },
      {
        model: db.Route,
        where: {
          routstartLocnId: req.body.requiredPickupLocnId, 
          endLocnId: req.body.requiredDropoffLocnId,
        }
      }
    ]

    // ----- OR ----- 
    // where: {

    //   // compare request FROM and TO Locations with Drivers default route FROM and TO Locations
    //   // required location services API
      
    //   // From Driver Table
    //   "$Driver.expiryDate$": { [Op.gt]: req.body.requiredDate }, //  should be greater than the req.body.requiredDate
    //   "$Driver.workingWithChildren$": true,
      
    //   // From Associated Vehicle Table
    //   "$Vehicle.spareSpots$": { [Op.gte]: 1 }, // sparespots should be atleast 1
    //   "$Vehicle.spareChildSeats$" : req.body.carSeatsRequired,
    //   "$Vehicle.spareBoosters$" : req.body.boostersRequired,
    //   "$Vehicle.addedRouteTime$" : req.body.addedRouteTime,
    //   "$Vehicle.boostersRequired$" : req.body.boostersRequired,
    //   "$Vehicle.carSeatsRequired$" : req.body.carSeatsRequired,

    //   // From Associated Route Table
    //   "$Route.routstartLocnId$": req.body.requiredPickupLocnId, 
    //   "$Route.endLocnId$": req.body.requiredDropoffLocnId,
    //   // routeName:"" // May not be required if google api resolves addresses into geocoded places

    // },
    // include: [db.Driver, db.Vehicle, db.Route]
  }).then(function(dbMember) {
    res.json(dbMember);
    emailDriver(dBMember)
  });
});

function emailDriver (driverObj) {
  // require nodemailer
  console.log("Calling emailDriver function");
  console.log(driverObj);
}


// ----- Post Routes -----------------------

    // GET route for getting all of the posts
    app.get("/api/posts", function(req, res) {
      var query = {};
      if (req.query.author_id) {
        query.AuthorId = req.query.author_id;
      }
      // Here we add an "include" property to our options in our findAll query
      // We set the value to an array of the models we want to include in a left outer join
      // In this case, just db.Author
      db.Post.findAll({
        where: query,
        include: [db.Author]
      }).then(function(dbPost) {
        res.json(dbPost);
      });
    });
  
    // Get route for retrieving a single post
    app.get("/api/posts/:id", function(req, res) {
      // Here we add an "include" property to our options in our findOne query
      // We set the value to an array of the models we want to include in a left outer join
      // In this case, just db.Author
      db.Post.findOne({
        where: {
          id: req.params.id
        },
        include: [db.Author]
      }).then(function(dbPost) {
        res.json(dbPost);
      });
    });
  
    // POST route for saving a new post
    app.post("/api/posts", function(req, res) {
      db.Post.create(req.body).then(function(dbPost) {
        res.json(dbPost);
      });
    });
  
    // DELETE route for deleting posts
    app.delete("/api/posts/:id", function(req, res) {
      db.Post.destroy({
        where: {
          id: req.params.id
        }
      }).then(function(dbPost) {
        res.json(dbPost);
      });
    });
  
    // PUT route for updating posts
    app.put("/api/posts", function(req, res) {
      db.Post.update(
        req.body,
        {
          where: {
            id: req.body.id
          }
        }).then(function(dbPost) {
        res.json(dbPost);
      });
    });
  };
  