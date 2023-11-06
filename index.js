const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middleWare
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dd29rey.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Collection 
        const foodCollection = client.db('Restaurant').collection('allFoods');

        app.get('/api/v1/allFoods',async(req,res)=>{
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            // console.log(page,size);

            const result = await foodCollection.find().skip(page*size).limit(size).toArray()
            res.send(result)
        })

        // get My added foods by email
        app.get('/api/v1/myAddedFoods',async(req,res)=>{
            console.log(req.query.email);

            let query = {}
            if(req.query?.email){
                query = {made_by: req.query.email}
            }
            const result = await foodCollection.find(query).toArray()
            res.send(result)
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("Server is running smoothly")
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
