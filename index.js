const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middleWares
app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log(token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access' })
        }
        req.user = decoded
        next()
    })
}



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
        const orderedCollection = client.db('Restaurant').collection('orders');

        // jwt token generator
        app.post('/api/v1/jwt', async (req, res) => {
            const userEmail = req.body;
            console.log(userEmail);
            const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })
        })
        // Clear jwt token when user logout
        app.post('/api/v1/logout', async (req, res) => {
            const userEmail = req.body;
            res.clearCookie('token', { maxAge: 0 })
                .send({ success: true })
        })


        // Find all food by page and size
        app.get('/api/v1/allFoods', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            // console.log(page,size);
            const result = await foodCollection.find().skip(page * size).limit(size).toArray()
            res.send(result)
        })

        // All food count
        app.get('/api/v1/totalFood', async (req, res) => {
            const count = await foodCollection.estimatedDocumentCount()
            res.send({ count })
        })

        // get My added foods by email
        app.get('/api/v1/myAddedFoods', verifyToken, async (req, res) => {

            if(req.user.email !== req.query.email){
                return res.status(403).send({message: 'Forbidden access'})
            }

            // console.log(req.query.email);
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
        app.get('/api/v1/get-user-orders',verifyToken, async (req, res) => {
            const email = req.query.email
            // console.log(email);
            if(req.user.email !== email){
                return res.status(403).send({message: 'Forbidden access'})
            }
            const query = { buyerEmail: email }
            // console.log(query);
            const result = await orderedCollection.find(query).toArray()
            res.send(result)
        })
        // delete user ordered single food
        app.delete('/api/v1/delete-user-single-food/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await orderedCollection.deleteOne(query)
            console.log(result);
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
