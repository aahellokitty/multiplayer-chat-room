$(function() {
    var socket = io()

    $('#name').keyup((ev)=> {
        if(ev.which == 13) {
            inputName();
        }
    });

    $('#nameBtn').click(inputName)

    function inputName() {
        var imgN = Math.floor(Math.random()*4)+1
        if($('#name').val().trim() !== '') {
            //触发而客户端登录
            socket.emit('login', {
                name: $('#name').val(),
                img: 'image/user' + imgN + '.jpg'
            })
        }
        return false
    }

    socket.on('loginSuc', () => {
        $('.name').hide();
    })

    socket.on('loginError', () => {
        alert('用户名已经存在，请重新输入');
        $('#name').val('');
    });

    socket.on('system', (user) => {
        var data = new Date().toTimeString().substr(0, 8)
        $('#messages').append(`<p class='system'><span>${data}</span><br /><span>${user.name}  ${user.status}了聊天室</span></p>`)
        $('#messages').scrollTop($('#messages')[0].scrollHeight)
    })

    socket.on('disUser', (usersInfo) => {
        $('#users').text('')
        if(!usersInfo.length) {
            $('.contacts p').show();
        } else {
            $('.contacts p').hide();
        }
        $('#num').text(usersInfo.length)
        usersInfo.map((item, index, arr) => {
            $('#users').append(`<li><img src="${item.img}"/><span>${item.name}</span></li>`)
        })
    })

    //抖动消息回应
    socket.on('shakeAs', (user) => {
        var data = new Date().toTimeString().substr(0, 8);
        $('#messages').append(`<p class='system'><span>${data}</span><br /><span>${user.name}发送了一个窗口抖动</span></p>`);
        shake();
        // 滚动条总是在最底部
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    })

    var timer;
    function shake() {
        $('.main').addClass('shaking');
        clearTimeout(timer);
        timer = setTimeout(()=> {
          $('.main').removeClass('shaking');
        }, 500);
    }

    //实现发送消息
    $('#m').keyup((ev) => {
        if(ev.which == 13) {
            sendMsg()
        }
    })
    $('#sub').click(sendMsg)

    var color = '#000000';
    function sendMsg() {
        if($('#m').val == '') {
            console.log('请输入内容')
            return false
        }
        color = $('#color').val()
        socket.emit('sendMsg', {
            msg: $('#m').val(),
            color: color,
            type: 'text'
        })
        $('#m').val('')
        return false
    }

    socket.on('receiveMsg', (obj) => {
        var msg = obj.msg;
        var content = '';
        while(msg.indexOf('[') > -1) {  // 其实更建议用正则将[]中的内容提取出来
            var start = msg.indexOf('[');
            var end = msg.indexOf(']');

            content += '<span>'+msg.substr(0, start)+'</span>';
            content += '<img src="image/emoji/emoji%20('+msg.substr(start+6, end-start-6)+').png">';
            msg = msg.substr(end+1, msg.length);
        }
        content += '<span>'+msg+'</span>';
        if(obj.type == 'img') {
            $('#messages').append(`
          <li class='${obj.side}'>
            <img src="${obj.img}">
            <div>
              <span>${obj.name}</span>
              <p style="padding: 0;">${obj.msg}</p>
            </div>
          </li>
        `);
            $('#messages').scrollTop($('#messages')[0].scrollHeight);
            return;
        }

        $('#messages').append(`
            <li class="${obj.side}">
              <img src="${obj.img}">
              <div>
                <span>${obj.name}</span>
                <p style="color: ${obj.color};">${content}</p>
              </div>
            </li>`)

        //滚动条总是在最底部
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    })

    //用户发送图片
    $('#file').change(function () {
        var file = this.files[0]
        var reader = new FileReader()
        
        reader.onerror = function () {
            console.log('文件读取失败，请重试')
        }
        //读取成功之后
        reader.onload = function () {
            var src = reader.result
            var img = '<img class="sendImg" src="'+src+'">'
            socket.emit('sendMsg', {
                msg: img,
                color: color,
                type: 'img'
            })
        }
        reader.readAsDataURL(file)
    })

    //渲染表情
    init();
    function init() {
        for(var i = 0; i < 141; i++) {
            $('.emoji').append('<li id='+i+'><img src="image/emoji/emoji ('+(i+1)+').png"></li>');
        }
    }

    //显示表情面板
    $('#smile').click(() => {
        $('.selectBox').css('display', 'block')
    })
    $('#smile').dblclick((ev)=> {
        $('.selectBox').css('display', "none");
    });
    $('#m').click(()=> {
        $('.selectBox').css('display', "none");
    });

    $('.emoji li img').click((ev) => {
        ev = ev || window.event
        var src = ev.target.src
        var emoji = src.replace(/\D*/g, '').substr(6, 8)
        var old = $('#m').val()
        $('#m').val(old+'[emoji'+emoji+']')
        $('.selectBox').css('display', 'none')
    })

    //抖动窗口
    $('.edit #shake').click(function () {
        socket.emit('shake')
    })

    //断开连接
    $('#clear').click(closeConnection)

    function closeConnection() {
        $('#messages').text('')
        socket.emit('disconnect')
    }
});
