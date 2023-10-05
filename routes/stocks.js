const express = require('express');
const router = express.Router();
const axios = require('axios');
const mysqlConnection = require('../db/db');
const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
require('dotenv').config();

router.get('/home', async (req, res) => {
    try {
      const apiUrl = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;
  
      const response = await axios.get(apiUrl);
      const data = response.data;
      let stocks=[]
      let stocksString="Select symbol,name from stockes_data where symbol IN ("
      let gainers_length=data["top_gainers"].length;
        for(let i=0;i<gainers_length;i++)
        {
            stocksString+="'"+data["top_gainers"][i]["ticker"]+"'"+",";
        }
        gainers_length=data["top_losers"].length;
        for(let i=0;i<gainers_length;i++)
        {
            stocksString+="'"+data["top_losers"][i]["ticker"]+"'"+",";
        }
        gainers_length=data["most_actively_traded"].length;
        for(let i=0;i<gainers_length;i++)
        {
            stocksString+="'"+data["most_actively_traded"][i]["ticker"]+"'";
            if(i!==gainers_length-1)stocksString+=','
        }
        stocksString+=')'
        Stocks_name={}
        mysqlConnection.query(
            stocksString,(err,rows,fields)=>{
                if (err) {
                    console.error('Error fetching user stocks: ' + err.stack);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                for(let i=0;i<rows.length;i++){
                    Stocks_name[rows[i]['symbol']]=rows[i]['name']
                }
                let result={"data":data.metadata}
                result.top_gainers=[];result.top_losers=[];result.most_actively_traded=[]
                for(let i=0;i<10;i++)
                {
                    obj={name:Stocks_name[data.top_gainers[i]["ticker"]]}
                    result.top_gainers.push({...data.top_gainers[i],...obj})
                }
                for(let i=0;i<10;i++)
                {
                    obj={name:Stocks_name[data.top_losers[i]["ticker"]]}
                    result.top_losers.push({...data.top_losers[i],...obj})
                }
                for(let i=0;i<10;i++)
                {
                    obj={name:Stocks_name[data.most_actively_traded[i]["ticker"]]}
                    result.most_actively_traded.push({...data.most_actively_traded[i],...obj})
                }
               res.json(result);
            }
        )
    } catch (error) {
      console.error('Error SQL:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  router.post('/subscribe', async (req, res) => {
        const { stock_id, user_id } = req.body;
        const query = 'INSERT INTO users_stocks (symbool, user_id) VALUES (?, ?)';
        const values = [stock_id, user_id];

        mysqlConnection.query(query, values, (error, results, fields) => {
            if (error) {
            console.error('Error saving user to database: ' + error.stack);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
            }

            console.log('User_Stocks saved successfully with ID: ', results.insertId);
            res.status(201).json({ message: 'User_Stocks saved', userId: results.insertId })});
  
  });

  router.post('/unsubscribe', async (req, res) => {
    const { stock_id, user_id } = req.body;
    const query = `DELETE FROM users_stocks WHERE user_id = ? AND symbool = ?`;
    const values = [user_id, stock_id];

    mysqlConnection.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error deleting user stocks from the database: ' + error.stack);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('User stocks deleted successfully');
        res.status(200).json({ message: 'User stocks unsubscribed successfully' });
    });
});


router.post('/alert', async (req, res) => {
    const { price, email_check, user_id, stock_id } = req.body;
    const query = 'UPDATE users_stocks SET price = ?, email_check = ? WHERE user_id = ? AND symbool = ?';
    const values = [price, email_check, user_id, stock_id];

    mysqlConnection.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error updating user stocks in the database: ' + error.stack);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        console.log('User stocks updated successfully');
        res.status(200).json({ message: 'User stocks updated successfully' });
    });
});


router.post('/delete/alert', async (req, res) => {
    const { user_id, stock_id } = req.body;
    const query = 'UPDATE users_stocks SET price = NULL, email_check = NULL WHERE user_id = ? AND symbool = ?';
    const values = [user_id, stock_id];

    mysqlConnection.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error deleting user stock alert from the database: ' + error.stack);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        console.log('User stock alert deleted successfully');
        res.status(200).json({ message: 'User stock alert deleted successfully' });
    });
});



  router.get('/user/:user_id', async (req, res) => {
    const user_id = req.params.user_id;
    const query = `SELECT symbol,name,subscribed_at,assetType,exchange FROM users_stocks inner join stockes_data on stockes_data.symbol=users_stocks.symbool where user_id=${user_id};`;
    mysqlConnection.query(
        query,(err,rows,fields)=>{
            if (err) {
                console.error('Error fetching user stocks: ' + err.stack);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.json(rows);
        }
    )
});

router.get('/search', async (req, res) => {
    const { word } = req.query;
    const query = `SELECT symbol, name, exchange FROM stockes_data WHERE name LIKE '%${word}%';`;

    mysqlConnection.query(query, (err, rows, fields) => {
        if (err) {
            console.error('Error fetching stockes_data: ' + err.stack);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        res.json(rows);
    });
});

module.exports = router;
