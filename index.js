const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);



const express= require("express")
const dotenv=require("dotenv")
dotenv.config()
const cors=require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri =process.env.MONGO_DB_URI;
const app= express()
const PORT =process.env.PORT || 5000;


app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;

  // already Date object
  if (dateStr instanceof Date) {
    return dateStr.getTime();
  }

  // timestamp
  if (typeof dateStr === "number") {
    return dateStr;
  }

  // must be string
  if (typeof dateStr !== "string") {
    console.log("Invalid date:", dateStr);
    return null;
  }

  const [day, month, year] = dateStr.split("/");

  return new Date(`${year}-${month}-${day}`).getTime();
};
async function run() {
  try {
    
    await client.connect();
   const db= client.db("tutor-find")
   const tutorCollection= db.collection("tutors")
   const bookingCollection=db.collection("bookings")

app.get("/tutors",async(req,res)=>{
 const { search, startDate, endDate } = req.query;
console.log("QUERY:", req.query);
console.log("SEARCH:", req.query.search);
      let query={};
      
      if (search) {
        
            
             query.tutorname= {
                $regex: search,
                $options: 'i',
              };
            
          
            }

      let result = await tutorCollection.find(query).toArray();

     const start = startDate ? new Date(startDate).getTime() : null;
const end = endDate ? new Date(endDate).getTime() : null;

if (start || end) {
  result = result.filter((tutor) => {
    const tutorDate = normalizeDate(tutor.sessionDate);

    if (!tutorDate) return false;

    if (start && tutorDate < start) return false;
    if (end && tutorDate > end) return false;

    return true;
  });
}
      
      res.json(result);
  


})  


app.post("/tutors",async(req,res)=>{
 const tutorData= req.body;
 console.log(tutorData)
 const result= await tutorCollection.insertOne(tutorData)
res.json(result)

})
app.patch("/tutors/:id",async(req,res)=>{
 const {id}= req.params;
 const updateData=req.body
 
 const result= await tutorCollection.updateOne(
  {_id:new ObjectId(id)},
  {$set:updateData}
 )
res.json(result)

})
app.delete("/tutors/:id",async(req,res)=>{
 const {id}= req.params;
 
 
 const result= await tutorCollection.deleteOne(
  {_id:new ObjectId(id)}

 )
res.json(result)

})

app.get("/bookings/:userId",async(req,res)=>{
  try {
    const { userId } = req.params;
    const result = await bookingCollection.find({ userId: userId }).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
});
app.post("/bookings",async(req,res)=>{

const bookingData= req.body;
const {tutorId,tutorname,userId,phone,name,email}= bookingData;
const tutor= await tutorCollection.findOne({
  _id: new ObjectId(tutorId),
});
if(!tutor){
  return res.status(404).json({
    success:false,
    message:"Tutor not found"
  })
}
const currentDate= new Date();
const sessionDate= new Date(tutor.sessionDate);
if(currentDate>sessionDate){
  return res.status(400).json({
    success:false,
    message:"Booking is not available for this tutor.Session date passed."
  })
}

if(tutor.slot<=0){
  return res.status(400).json({
    success:false,
    message:"This session is fully booked. You can't join at the moment",
  })
}
const existingBooking = await bookingCollection.findOne({
  tutorId,
  userId,
  bookingStatus: {
    $ne: "cancelled",
  },
});

if (existingBooking) {
  return res.status(400).json({
    success: false,
    message: "You already book the session",
  });
}
const newBooking={tutorId,tutorname,userId,phone,name,email,bookingStatus:"confirmed",createdAt:new Date()}
const result= await bookingCollection.insertOne(newBooking);
await tutorCollection.updateOne({
  _id:new ObjectId(tutorId)
},{
  $inc:{
    slot:-1,
  }
})
res.json({
  success:true,
  message:"Booking successful",
  result,
});
})

app.patch("/bookings/:id",async(req,res)=>{
  try{
   const { id } = req.params;
   const booking = await bookingCollection.findOne({
      _id: new ObjectId(id),
    });

   
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }
   const result= await bookingCollection.updateOne({
    _id:new ObjectId(id),
   },
  {
    $set:{
      bookingStatus:"cancelled"
    }
  })
  await tutorCollection.updateOne(
      {
        _id: new ObjectId(booking.tutorId),
      },
      {
        $inc: {
          slot: 1,
        },
      }
    );
  res.json({
    success:true,
    message:"Booking cancel",
    result
  })

  }
  catch(error){
console.log(error);
res.status(500).json({
  success:false,
  message:"Server error"
})
  }
});

app.get("/tutors/:id",async(req,res)=>{
  const {id}= req.params

  const result= await tutorCollection.findOne({_id:new ObjectId(id)})

  res.json(result)
})


app.get("/featured-tutors",async(req,res)=>{
  const result= await tutorCollection
  .find().limit(6).toArray();
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
