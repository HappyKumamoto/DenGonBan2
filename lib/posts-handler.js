'use strict';
const pug = require('pug');
const Post = require('./post');
const util =require('./handler-util');
//const contents = [];

//function handle(req, res) {
  async function handle(req, res){
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      //res.end(pug.renderFile('./views/posts.pug', { contents }));
      const posts = await Post.findAll({order:[['id', 'DESC']]});
      res.end(pug.renderFile('./views/posts.pug', { posts, user: req.user }));
      break;
    case 'POST':
      let body = ''; // POSTの処理 ここから
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);
        const content = params.get('content');
        console.info(`送信されました: ${content}`);
        //contents.push(content);
        //console.info(`送信された全内容: ${contents}`);
        await Post.create({
          content,
          postedBy: req.user
        });
        handleRedirectPosts(req, res);
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);
        const id = params.get('id');
        const post = await Post.findByPk(id);
        if (req.user === post.postedBy) {
          await post.destroy();
          console.info(
            `削除されました: user: ${req.user}, id=${id}, 削除内容「${post.content}」,\n
             remoteAddress: ${req.socket.remoteAddress},\n
             userAgent: ${req.headers['user-agent']}\n`
          )
          handleRedirectPosts(req, res);
        }
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

module.exports = {
  handle,
  handleDelete
};