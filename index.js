const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);



const express= require("express")
const dotenv=require("dotenv")
dotenv.config()
const cors=require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri =process.env.MONGO_DB_URI;
const app= express()
const PORT =process.env.PORT;


app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    await client.connect();
   const db= client.db("tutor-find")
   const tutorCollection= db.collection("tutors")

app.get("/tutors",async(req,res)=>{

 const result= await tutorCollection.find().toArray();
res.json(result)

})  

app.post("/tutors",async(req,res)=>{
 const tutorData= req.body;
 console.log(tutorData)
 const result= await tutorCollection.insertOne(tutorData)
res.json(result)

})

app.get("/tutors/:id",async(req,res)=>{
  const {id}= req.params

  const result= await tutorCollection.findOne({_id:new ObjectId(id)})

  res.json(result)
})


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    
  }
}
run().catch(console.dir);

app.get ("/",(req,res)=>{
   res.send("server running fine") 
})
app.listen(PORT,()=>{
    console.log("backend server running..")
})
//B9Dvy2FrBLKRpYHI
//tutor-find-app