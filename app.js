//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose=require('mongoose');
const _=require('lodash');

//if github se koi project uthya and uspe kaam krna h, to write npm i
//isse uske sab modules install hojayenge.

mongoose.connect("mongodb+srv://nutan:786786@cluster0.f86ij6n.mongodb.net/todolistDB",function(err){
  if(err) console.log(err);
  else console.log("connected sucessfully");
});


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//const items = ["Buy Food", "Cook Food", "Eat Food"];
//const workItems = [];
const listSchema=new mongoose.Schema({name:String});
const list=new mongoose.model('List',listSchema);
const item1=new list({name:'cook food'});
const item2=new list({name:'eat food'});
itemlist=[item1,item2];
const day='Today';

// list.insertMany(itemlist,function(err){
//   if(err) console.log(err);
//   else console.log('sucesfully added default list');
// });
//this part over

// app.get("/", function(req, res) {

// const day = date.getDate();

//   res.render("list", {listTitle: day, newListItems: items});

// });

//new version
// app.get('/',function(req,res){ 
// list.find({},function(err,founditems){
//   if(err) console.log(err+'noo!!!!');
//   else {
//     res.render('list',{listTitle:day,newListItems:founditems}); 
//   }
// })
// })
//but there is a problem, that everytime server restarts, default items
//are loaded in to the db, to solve this, check if the default list is empty than only insert 
//default items into the db.

//updated version

app.get('/',function(req,res){
  let dlength;
  list.find({},function(err,founditem){
    if(err) console.log(err);
    else {console.log('success in finding');
    dlength=founditem.length;
    console.log(dlength);
    if(dlength===0)
    {
      list.insertMany(itemlist,function(err){
        if(err) console.log(err);
        else console.log('added to the db');
      });
      res.redirect('/');
      // list.find({},function(err,founditems){
      //   if(err) console.log(err);
      //   else {
      //   res.render('list',{listTitle:day,newListItems:founditems});
      //   //res.redirect('/');
      //   }
      // }); 
    }
    else {
      list.find({},function(err,founditems){
        if(err) console.log(err);
        else {
        res.render('list',{listTitle:day,newListItems:founditems});
        }
      });
    } }
  });
  //res.redirect('/');
 // console.log(dlength); //not possible due to asynchronous nature of js.
  // if(dlength===0)
  // {
  //   list.insertMany(itemlist,function(err){
  //     if(err) console.log(err);
  //     else console.log('added to the db');
  //   });
  //   list.find({},function(err,founditems){
  //     if(err) console.log(err);
  //     else {
  //     res.render('list',{listTitle:day,newListItems:founditems});
  //     }
  //   }); 
  // }
  // else {
  //   list.find({},function(err,founditems){
  //     if(err) console.log(err);
  //     else {
  //     res.render('list',{listTitle:day,newListItems:founditems});
  //     }
  //   });
  // }
});

// app.post("/", function(req, res){

//   const item = req.body.newItem;

//   if (req.body.list === "Work") {
//     workItems.push(item);
//     res.redirect("/work");
//   } else {
//     items.push(item);
//     res.redirect("/");
//   }
// });

app.post('/',function(req,res){
  const niname=req.body.newItem; //toinsert every item, we will need to create its object
  const clname=req.body.list;
  if(clname==='Today')
  {
    const ni=new list({name:niname});
    list.insertMany(ni,function(err){
    if(err) console.log(err);
    });
    res.redirect('/');
  }
  else 
  {
    //if the list name is not today, than find that list and insert that new item name in that 
    //custom lists ka list which is an array of list schema.
    List.findOne({name:clname},function(err,found_item){
      found_item.list.push({name:niname});  //this adds new item to the founditem's list, which is an array
      //console.log(found_item.list);
      found_item.save();
      res.redirect('/'+clname);
    })
  }
  
});
//to add fn of adding new item in customlist, we add a value to submit button
//and if this value is today than add to the og list, else find from List
//collection, the name of list and add to its list(which is an array) the new item, and 
//than redirect to the current page again. 

app.post('/delete',function(request,response){  //it is mandatory to have a callback
  //fn in findbyidandremove, was only find hoga, and not removal.
  const id=request.body.check;
  const listname=request.body.lname;
  if(listname==='Today')
  {
    list.findByIdAndRemove(id,function(err){
      if(err) console.log(err);
      else console.log("removal was sucessfull");
    })
    response.redirect('/');
  }
  else 
  {
    //now we need to find the lsit and match the id and delete.
    List.findOneAndUpdate({name:listname},{$pull:{list: {_id:id}}}, //yaha id k badle name bhi dal sakte h.
    //its like go to this foundone and go to its list, match the id and delete it.
    //since uss array mese delete therefore we used $pull. 
    // $ sign indicates its a fn of mongodb.
    function(err,found)
    {
      if(err) console.log(err)
      else response.redirect('/'+listname);
    }
      // for(var i=0;i<founditem.list.length;i++){
      //   //console.log(item._id);
      //   if(founditem.list[i]._id==id)
      //   {
      //     //console.log(founditem.list[i].name);
      //   }
      // }
    );
  }
  
  //console.log(id);
  
});

//creating a new schema for storing custom lists, with their names.
//since thats the only way of identifying them.

const customschema=new mongoose.Schema({name:String,list:[listSchema]});
//list will have an array of type listSchema, whivh are the og schemas.
const List=new mongoose.model('clist',customschema);

//now code for getting custom named list list pages
//we will use express route parameters

//if they queried for capital Work when they made work, they will get a new
//page, to correct this, we will use lodash.
app.get('/:customlist',function(req,res){
  const cname=_.capitalize(req.params.customlist);
  // now we will see if list with same name exist, if yes than we will not add default 
  // values to it, otherwise we will add default values to it.
  List.findOne({name:cname},function(err,found_item){
    if(found_item){
      res.render('list',{listTitle:cname,newListItems:found_item.list});
      //res.redirect('/'+cname);
    } 
    else {
      let nl=new List({name:cname,list:itemlist});
      List.insertMany(nl);
      res.render('list',{listTitle:cname,newListItems:nl.list});
      //res.redirect('/'+cname);
      //console.log(cname);
    }
    //res.redirect('/'+cname);
  });
//after this lodash update the project finally is over.
  

  // let nl=new List({name:cname,list:itemlist});
  // nl.save();
  // console.log(cname);
  //response1.redirect('/'+cname);
  
});



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

