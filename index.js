var express = require('express');
var fs = require('fs');
var app = express();
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname+'/dist/node-media-server'));

app.get('/listUnFetchedMovies',function(req,res){
    console.log('Requesting unfetched movies list');
    fs.readdir(__dirname+'/movies',function(err,moviesList){
        if(err){
            console.log('Error in getting unfetched movies: ',err);
            res.json({success:false,data:{msg:'Something went wrong. Please try again.'}});
        }else{
            const modifiedArray=[];
            moviesList.forEach(moviePath => {
                if(moviePath.indexOf('fetched_')==-1){
                    modifiedArray.push(moviePath);
                }
            });
            res.json({success:true,data:{msg:'Successful',data:modifiedArray}});
        }
    });
});

app.get('/moviesList', function (req, res) {
    console.log('Requesting movies list...');
    fs.readdir(__dirname + '/movies', function (err, moviesList) {
        if (err) {
            console.log('Error in fetching movies list: ', err);
            res.json({ success: false, data: 'Error in fetching movies list' });
        } else {
            res.json({ success: true, data: { msg: 'Movies list fetched successfully', data: moviesList } });
        }
    });
});

app.get('/movie/:path', function (req, res) {
    const path = __dirname + '/movies/' + req.params.path;
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(path, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head);
        fs.createReadStream(path).pipe(res);
    }
});

app.get('/', function (req, res) {
    res.sendFile(__dirname+'/dist/node-media-server/index.html');
});

app.listen(3000, function (err) {
    if (err) {
        console.log('Error in starting server: ', err);
    } else {
        console.log('Server started successfully on port 3000');
    }
})