let express = require('express');
let bodyparse = require('body-parser');
let mongoose = require('mongoose');

let app = express();

// set template engine
app.engine('html', require('ejs').renderFile);

app.set('view engine', 'html');
app.set('port', 8080);

app.use(bodyparse.urlencoded({extended:false}));
app.use(bodyparse.json());
app.use(express.static('views'));
app.use(express.static('css'));
app.use(express.static('images'));

// create developer schema
var developerSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    'DeveloperId': {
        type: Number,
        required: true
    },
    'Name': {
        firstName: {
            type: String,
            required: true
        },
        lastName: String
    },
    'Level': {
        type: String,
        validate: {
            validator: function(status){
                return status == 'Beginner' || status == 'Expert';
            },
            message: 'Task status must be InProgress or Complete.'
        }
    },
    'Address': {
        'State': String,
        'Suburb': String,
        'Street': String,
        'Unit': String
    }
})
var developer = mongoose.model('developers', developerSchema)

// create task schema 
var taskSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    'TaskId': {
        type: Number,
        required: true
    },
    'TaskName': String,
    'AssignTo': {
        type: Number,
        ref: 'developers'
    },
    'DueDate': Date,
    'TaskStatus': {
        type: String,
        validate: {
            validator: function(status){
                return status == 'InProcess' || status == 'Complete';
            },
            message: 'Task status must be InProgress or Complete.'
        }
    },
    'TaskDescription': String
});
var task = mongoose.model('tasks', taskSchema)

// connect database
let url = 'mongodb://localhost:27017/taskdb';
mongoose.connect(url, function(err) {
    if (err) throw err;
    console.log("==============>Connect to database<==============");
})

// homepage
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/' + 'index.html');
})

// get in insert developer page
app.get('/newDeveloper', function(req, res) {
    res.sendFile(__dirname + '/views/' + 'newdeveloper.html');
})

// insert developer
app.post('/addDeveloper', function(req, res) {
    // get web data
    let firstname = req.body.firstName;
    let lastname = req.body.lastName;
    let level = req.body.level;
    let state = req.body.state;
    let suburb = req.body.suburb;
    let street = req.body.street;
    let unit = req.body.unit;

    developer.find().sort({"DeveloperId": "desc"}).exec(function(err, docs) {
        if (docs.length == 0) {
            var devid = 1;
        } else {
            var devid = docs[0].DeveloperId + 1;
        }
        let dev = new developer({
            _id: new mongoose.Types.ObjectId(),
            DeveloperId: devid,
            Name: {
                firstName: firstname,
                lastName: lastname
            },
            Level: level,
            Address: {
                State: state,
                Suburb: suburb,
                Street: street,
                Unit: unit
            }
        })
        dev.save(function(err) {
            if (err) throw err;
            console.log("Add developer")
        })
    })

    res.redirect("/newDeveloper")
})

// display all developers
app.get('/listdevelopers', function(req, res) {
    developer.find({}, function(err, docs) {
        res.render('listdevelopers', {'developers': docs})
    })
})

// insert task page
app.get('/newtask', function(req, res) {
    res.sendFile(__dirname + '/views/' + 'newtask.html');
})

// insert task
app.post('/addtask',function(req,res){
    // get web data
    let taskName = req.body.taskName;
    let assignTo = parseInt(req.body.assignTo);
    // convert to datetime 
    let str_date = req.body.taskDue;
    let taskDue = new Date(str_date.replace(/-g/, '/'));
    let taskStatus = req.body.taskStatus;
    let taskDesc = req.body.taskDesc;

    task.find().sort({"TaskId": "desc"}).exec(function(err, docs) {
        if (docs.length == 0) {
            var taskid = 1;
        } else {
            var taskid = docs[0].TaskId + 1;
        }

        let tk = new task({
            _id: new mongoose.Types.ObjectId(),
            TaskId: taskid,
            TaskName: taskName,
            AssignTo: assignTo,
            DueDate: taskDue,
            TaskStatus: taskStatus,
            TaskDescription: taskDesc
        });
        tk.save(function(err) {
            if (err) throw err;
            console.log("Add task");
        })
    })
    res.redirect('/listtasks');
})

// display all tasks
app.get('/listtasks', function(req, res) {
    task.find({}, function(err, docs) {
        res.render('listtasks', {'tasks': docs})
    })
})

// delete one task reference by taskid
app.post('/deletetask', function(req, res) {
    let taskid = req.body.taskId;
    let filter = {TaskId: parseInt(taskid)}
    task.deleteOne(filter, function(err, doc) {
        console.log(doc);
    });
    res.redirect('/listtasks')
})

// delete all completed tasks
app.get('/deleteCompleteTasks', function(req, res) {
    let filter = {TaskStatus: 'Complete'};
    task.deleteMany(filter, function(err, obj) {
        console.log(obj);
    });
    res.redirect('/listtasks')
})

// update task
app.post('/updateTask', function(req, res) {
    let taskid = req.body.taskid;
    let taskstatus = req.body.taskStatus;
    let filter = {TaskId: parseInt(taskid)}
    let theUpdate = {$set: {
        'TaskStatus': taskstatus
    }}
    task.updateOne(filter, theUpdate, function(err, doc) {
        console.log(doc);
    });
    res.redirect('/listtasks')
})
//extra task
app.get('/sort',function(req,res){

    task.where({'TaskStatus':'Complete'}).sort({'TaskName':-1}).limit(3).exec(function(err,docs){
        res.render('listtasks', {'tasks': docs});
    })
})
app.listen(app.get('port'));
console.log('Server is running at http://localhost:' + app.get('port'))