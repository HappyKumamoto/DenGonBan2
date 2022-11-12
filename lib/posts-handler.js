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
        'Content-Type': 'text/html; charset=utf-8',
        //'Content-Security-Policy': "default-src 'self'; script-src https://*; style-src https://*"
        //コンテンツセキュイティポリシー(CSP)を実装すると縦書きができなくなる
      });
      //res.end(pug.renderFile('./views/posts.pug', { contents }));
      const posts = await Post.findAll({order:[['id', 'DESC']]});
      //posts.forEach((post) => {
      //  post.content = post.content.replace(/\n/g, '<br>');//これは不必要
      //  post.formattedCreatedAt = dayjs(post.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
      //投稿日時を表示するとき
      //});
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
        if (req.user === post.postedBy || req.user === 'admin') {
          await post.destroy();
          console.info(
            `削除されました:\n
             削除者: ${req.user},\n
             削除id: ${id},\n
             投稿者: ${post.postedBy},\n
             削除内容:「${post.content}」,\n
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