var express = require('express');
var order_controller = require('../controllers/orderController');
var router = express.Router();

var isAuthenticated = function (req, res, next) {

	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects

	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');

}


module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
		
    	// Display the Login page with any flash message, if any
		res.render('login', { message: req.flash('message') });

	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {

		successRedirect: '/index',
		failureRedirect: '/',
		failureFlash : true  

	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		
		res.render('register',{message: req.flash('message')});

	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		
		successRedirect: '/index',
		failureRedirect: '/signup',
		failureFlash : true  

	}));

	/* GET Home Page */
	router.get('/index', isAuthenticated, order_controller.showGrocery);
	
	/* Handle Logout */
	router.get('/signout', function(req, res) {
		
		req.logout();
		res.redirect('/');

	});
	
	router.post('/saveitem', order_controller.saveItem); 

    router.get('/saveitem', isAuthenticated,function(req,res){
       console.log(req.body);
       res.redirect('/index');
    }); 
	
	router.get('/checkout',order_controller.checkout);

    router.get('/removeitem',isAuthenticated,order_controller.removeItem);

    router.get('/analytics',isAuthenticated,order_controller.displayAnalytics);

	return router;
	
}

