const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const orderedCollection = client.db('UserOrders').collection('orders');

        app.get('/api/v1/allFoods', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            // console.log(page,size);

            const result = await foodCollection.find().skip(page * size).limit(size).toArray()
            res.send(result)
        })

        // get My added foods by email
        app.get('/api/v1/myAddedFoods', async (req, res) => {
            console.log(req.query.email);

            let query = {}
            if (req.query?.email) {
                query = { made_by: req.query.email }
            }
            const result = await foodCollection.find(query).toArray()
            res.send(result)
        })

        // find specific food by id
        app.get('/api/v1/findSingleFood/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query)
            res.send(result)
        })

        // update single food by id
        app.patch('/api/v1/updateFood/:id', async (req, res) => {
            console.log(req.params.id);
            const id = req.params.id;
            const newFood = req.body;
            console.log(newFood);
            const filter = { _id: new ObjectId(id) }
            // console.log(filter);
            const updateFood = {
                $set: {
                    category: newFood.category,
                    description: newFood.description,
                    food_origin: newFood.food_origin,
                    image: newFood.image,
                    made_by: newFood.made_by,
                    name: newFood.name,
                    price: newFood.price,
                    quantity: newFood.quantity,
                    count: newFood.count
                }
            }
            const result = await foodCollection.updateOne(filter, updateFood)
            res.send(result)
        })

        // Add single food to mongodb
        app.post('/api/v1/addFood', async (req, res) => {
            const food = req.body;
            // console.log(food);
            const result = await foodCollection.insertOne(food)
            res.send(result)
        })



        // user Order collection
        //Post user order
        app.post('/api/v1/user-orders', async (req, res) => {
            const food = req.body;
            // console.log(food);
            const result = await orderedCollection.insertOne(food)
            res.send(result)
        })
        // get user order
        app.get('/api/v1/get-user-orders', async (req, res) => {
            const email = req.query.email
            // console.log(email);
            const query = { buyerEmail: email }
            // console.log(query);
            const result = await orderedCollection.find(query).toArray()
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
