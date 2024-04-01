// 실험중

const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://testaccount:Djsejalffl12@cluster0.s9ohawm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(uri);



exports.info = async (req, res) => {
    res.json("Hello!");
};


exports.accessDB = async (req, res) => {
    
    
    try {
    
    await client.connect();

    const db = client.db("sample_data");
    const coll = db.collection("sample_data");

    // Get the user's current score from the request object
    const userScore = req.user.score

    console.log(`이게 유저 점수임 ${req.user.score}`);

    // 실험중 Defines filtering criteria.
    let filter;
    if (userScore == 0) {
        const filter = {YEAR: 23};
    } else if (userScore == 1) {
        const filter = {YEAR: 20};
    } else {
        const filter = {YEAR: 21};
    }

    console.log(`이게 필터 결과임 ${filter}`);
    
    // Find documents matching the filter
    const cursor = coll.find(filter);

    // Collect the documents in an array
    const documents = await cursor.toArray();
    // Send the documents as a JSON response
    res.json(documents);


    //await cursor.forEach(console.log);

    } finally {
        await client.close();
    }

};