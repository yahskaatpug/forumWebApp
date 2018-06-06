var express= require('express');
var app    = express();
var Comment=require("./models/comment");
var User                 =require("./models/user");
var passport             =require("passport");
var bodyparser=require("body-parser");
var mongoose =require("mongoose");
var LocalStrategy        =require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var engine              =require("ejs-mate");
var port = process.env.PORT || 8080;

app.use(bodyparser.urlencoded({extended:true}));
app.set('view engine','ejs');
mongoose.connect("mongodb://localhost/forum_qa");
var forumSchema = new mongoose.Schema({
		title:String,
		image:String,
		body:String,
    comments:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Comment"
    }],
		created:{type:Date,default:Date.now},
		ask:{id:{type:mongoose.Schema.Types.ObjectId,ref:"User"},username:String}
	});
var Forum =mongoose.model("Forum",forumSchema);



app.use(require("express-session")({
		secret:"whats up",
		resave:false,
		saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyparser.urlencoded({extended:true}));
//app.set('view engine','ejs');
//app.engine('ejs',engine);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	next();
});

app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res){
        res.render('home');
});

app.get("/register",function(req,res){//show signUp page
		res.render("register");
});
app.post("/register",function(req,res){//handling user sign up
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
			if(err)
				res.render("register");
			else
			{
			passport.authenticate("local")(req,res,function(){
			res.redirect("/ques");})
			}

})
});
app.get("/login",function(req,res){//render login form
		res.render("login");
});



app.post("/login",passport.authenticate("local",{
			successRedirect:"/ques",
			failureRedirect:"/login"
}),function(req,res){

});
app.get("/logout",function(req,res){
		req.logout();
		res.redirect("/");
});


app.get('/ques',function(req,res){
        Forum.find({},(err,x) =>{
          if(err)
			         console.log(err);
		      else
               res.render("que",{forums:x});
        });
});
app.get("/ques/new",isLoggedIn,function(req,res){
		res.render("new");
});
app.get("/ques/:id",function(req,res){//4. show route:to show info about one campground
	Forum.findById(req.params.id).populate("comments").exec((err,forumFound) =>{
	//function given by mongoose
		if(err)
			console.log(err);
		else
			res.render("show",{forums:forumFound});
});
});

app.get("/ques/:id/comments/new",isLoggedIn,(req,res) =>{
	Forum.findById(req.params.id,(err,forums) =>{
	//function given by mongoose
		if(err)
			console.log(err);
		else
			res.render("comments/new",{forums:forums});
});
});
app.post("/ques",(req,res) =>{//2. create route:to add new campground to db
		var title=req.body.title;
		var image=req.body.image;
		var body=req.body.body;
		var ask ={id:req.user._id,
	username:req.user.username};
var newBlog={title:title,image:image,body:body,ask:ask};
	console.log(req.body);

	Forum.create(newBlog,function(err,Forum){
	if(err)
		console.log(err);
	else
	res.redirect("/ques");
})
});

app.post("/ques/:id/comments",(req,res) =>{//2. create route:to add new campground to db

	Forum.findById(req.params.id,(err,forums) =>{
	//function given by mongoose
		if(err)
			console.log(err);
		else{
			var text=req.body.text;
			var image=req.body.image;
			var author=req.body.author;
	    var newBlog={text:text,image:image,author:author};
			console.log(req.body);
			Comment.create(newBlog,function(err,comment){
			if(err)
				console.log(err);
			else{
				forums.comments.push(comment);
				forums.save();
				res.redirect('/ques/' + forums._id);
			}

	});
			}
});
});

function isLoggedIn(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}
	res.redirect("/login");
}

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
