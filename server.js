const express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = []; // 储存登录用户
var usersInfo = [];  // 存储用户姓名和头像

app.use('/', express.static(__dirname + '/www'));

io.on('connection', function(socket){
    // io.emit('disUser', usersInfo)
    //登录
    socket.on('login', (user) => {
        if(users.indexOf(user.name) > -1){
            socket.emit('loginError')
        }else {
            users.push(user.name)
            usersInfo.push(user)
            socket.emit('loginSuc')
            socket.nickname = user.name
            socket.img = user.img
            io.emit('system', {
                name: user.name,
                status: '进入'
            })
            io.emit('disUser', usersInfo)
            console.log(users.length + '个用户连接')
        }
    })

    //发送消息
    socket.on('sendMsg', (data) => {
        socket.broadcast.emit('receiveMsg', {
            msg: data.msg,
            name: socket.nickname,
            img: socket.img,
            color: data.color,
            type: data.type,
            side: 'left'
        })
        socket.emit('receiveMsg', {
            msg: data.msg,
            name: socket.nickname,
            img: socket.img,
            color: data.color,
            type: data.type,
            side: 'right'
        })
    })

    //抖动窗口
    socket.on('shake', () => {
        socket.emit('shakeAs', {
            name: '您'
        })
        socket.broadcast.emit('shakeAs', {
            name: socket.nickname
        })
    })

    //断开连接
    socket.on('disconnect', () => {
        var index = users.indexOf(socket.nickname)
        if (index > -1) {
            users.splice(index, 1)
            usersInfo.splice(index, 1)

            io.emit('system', {
                name: socket.nickname,
                status: '离开'
            })

            io.emit('disUser', usersInfo)
            console.log(socket.nickname+'已离开了房间')
        }
    })
});
http.listen(3000, function(){
    console.log('listening on *:3000');
});