var express = require("express");
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoute');
const stocks = require('./routes/stocks');

const PORT = process.env.PORT || 8000;

var app = express();


app.use(bodyParser.json());

app.use('/api', userRoutes); 
app.use('/stocks',stocks ); 

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
