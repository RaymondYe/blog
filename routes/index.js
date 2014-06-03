var crypto = require('crypto'),
  User = require('../modules/user.js');
Post = require('../modules/post.js');

//upload file
var fs = require('fs');

module.exports = function(app) {

  app.get('/', function(req, res) {
    Post.get(null, function(err, posts) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: 'Home',
        user: req.session.user,
        posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  //login
  app.get('/login', checkNotLogin);
  app.get('/login', function(req, res) {
    res.render('login', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function(req, res) {
    var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
    User.get(req.body.name, function(err, user) {
      if (!user) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login');
      }
      if (user.password != password) {
        req.flash('error', '密码错误!');
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登陆成功!');
      res.redirect('/');
    });
  });

  //reg
  app.get('/reg', checkNotLogin);
  app.get('/reg', function(req, res) {
    res.render('reg', {
      title: 'REGISTER',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function(req, res) {
    var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if (password_re != password) {
      req.flash('error', '两次输入的密码不一致!');
      return res.redirect('/reg'); //返回注册页
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function(err, user) {
      if (user) {
        req.flash('error', '用户已存在!');
        return res.redirect('/reg'); //返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function(err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg'); //注册失败返回主册页
        }
        req.session.user = user; //用户信息存入 session
        req.flash('success', '注册成功!');
        res.redirect('/'); //注册成功后返回主页
      });
    });
  });

  app.get('/post', checkLogin);
  app.get('/post', function(req, res) {
    res.render('post', {
      title: 'Post',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function(req, res) {
    var currentUser = req.session.user,
      post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function(err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success', '发布成功!');
      res.redirect('/'); //发表成功跳转到主页
    });
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function(req, res) {
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkLogin);
  app.post('/upload', function(req, res) {
    for (var i in req.files) {
      if (req.files[i].size == 0) {
        // 使用同步方式删除一个文件
        fs.unlinkSync(req.files[i].path);
        console.log('Successfully removed an empty file!');
      } else {
        var target_path = './public/images/' + req.files[i].name.toLowerCase();
        // 使用同步方式重命名一个文件
        fs.renameSync(req.files[i].path, target_path);
        console.log('Successfully renamed a file!');
      }
    }
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });

  app.get('/d', function(req, res) {
    res.download('../css/main.css');
  });

  app.get('/logout', function(req, res) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/'); //登出成功后跳转到主页
  });

  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录!');
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录!');
      res.redirect('back'); //返回之前的页面
    }
    next();
  }
};