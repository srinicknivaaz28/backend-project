//The adress of this server connected to the network is:
// URL -> http://localhost:8383
//IP -> 127.0.0.1:8383
const express =  require('express') 
const app = express()
const PORT = 8383

// ENDPOINT - HTTP VERBS((method) & Routes(or paths)
//The method informs the nature of the request and the route is a further 
// subdirecgtroy (basically we direct the request to the body of code to respond
//appropriately,and these locations or routes are called endpoints)


//Type 1 --Website endpoints(These endpoints are for sending back htmml and they typically comes when a user 
//entrs a url in a browser))
app.get('/', (req,res) =>{
// this is endpoint umber 1 - /
res.send('<h1>Homepage</h1>')
})

app.get('/dashboard', (req,res) =>{
    console.log('Ohh now I hit the /dashboard endpoint')
    res.send('<h1>dashboard</h1>')
})


//Type 2- API endpoints
console.log('This is a extra line')

app.listen(PORT, () => console.log('Server has started on: 8383'))