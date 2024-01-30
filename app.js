

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ =require("lodash")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://0.0.0.0:27017/todolistDB")
  

const itemsSchemea = {
   name:String
  };
const Item =mongoose.model("item",itemsSchemea);

const item1 =new Item({
  name:"Welcome to your todolist!"
});
const item2 =new Item({
  name:"Hit the + button to add a new item."
});
const item3 =new Item({
  name:"<-- Hit this to delete a item."
});
const defaultItems=[item1,item2,item3];
Item.countDocuments({})
  .then(count => {
    if (count === 0) {
      // Collection is empty, insert default items
      return Item.insertMany(defaultItems);
    } else {
      
      return Promise.resolve(); // Resolve the promise since no insertion is needed
    }
  })
  .then(() => {
    //console.log("Successfully saved default items to DB");
  })
  .catch((err) => {
    console.error(err);
  });

const customlists = {
    name:String,
    items:[itemsSchemea]
   };
 const List =mongoose.model("List",customlists);


  app.get("/", async function (req, res) {
    try {
      // Use the find method without any conditions to get all documents
      const foundItems = await Item.find();
  
      //const day = date.getDate();
  
      res.render("list", { listTitle: "Today", newListItems:foundItems });
    } catch (error) {
      console.error("Error retrieving items:", error);
      // Handle the error appropriately
      res.status(500).send("Internal Server Error");
    }
  });
  

  app.post("/", async function(req, res) {
    const itemName = req.body.newItem;
    const listTitle = req.body.list;
  
    const newItem = new Item({
      name: itemName
    });
  
    try {
      if (listTitle === "Today") {
        await newItem.save();
        console.log(`Successfully saved ${itemName} to DB`);
        res.redirect("/");
      } else {
        const foundList = await List.findOne({ name: listTitle });
  
        if (foundList) {
          foundList.items.push(newItem);
          await foundList.save();
          console.log(`Successfully added ${itemName} to list ${listTitle}`);
          res.redirect(`/${listTitle}`);
        } else {
          console.error(`List with title ${listTitle} not found`);
          res.status(404).send(`List with title ${listTitle} not found`);
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/delete", async (req, res) => {
    const itemID = req.body.checkBox;
    const listName = req.body.listName;
  
    // Check if the itemID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(itemID)) {
      console.error("Invalid ObjectId");
      return res.status(400).send("Invalid ObjectId");
    }
  
    try {
      if (listName === "Today") {
        const removedItem = await Item.findByIdAndDelete(itemID);
  
        if (!removedItem) {
          console.log("Item not found");
          return res.status(404).send("Item not found");
        }
  
        console.log(`Successfully removed item with ID ${itemID} from DB`);
        res.redirect("/");
      } else {
        const foundList = await List.findOne({ name: listName });
  
        if (foundList) {
          foundList.items.pull({ _id: itemID });
          await foundList.save();
  
          console.log(`Successfully removed item with ID ${itemID} from list ${listName}`);
          res.redirect(`/${listName}`);
        } else {
          console.error(`List with title ${listName} not found`);
          res.status(404).send(`List with title ${listName} not found`);
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });
  



  app.get("/:newList", async (req, res) => {
    const newListName = _.capitalize(req.params.newList);
  
    try {
      let foundList = await List.findOne({ name: newListName });
  
      if (!foundList) {
        foundList = new List({
          name: newListName,
          items: defaultItems
        });
  
        await foundList.save();
        res.redirect("/"+ newListName);
      }
      console.log(foundList.items)
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });
  
  

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3025, function() {
  console.log("Server started on port 3000");
});
