const Koa = require('koa');
const Pug = require('koa-pug');
const path = require("path");
const Router = require('koa-router');
const sqlite3 = require("sqlite3").verbose();
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const views = require('koa-views');





const app = new Koa();
const router = new Router();

//to add css
app.use(serve('public'));


// Set up body parser and views middleware
app.use(bodyParser());
app.use(views(path.join(__dirname, 'views'), { extension: 'pug' }));

//creating the database user
const db_name = path.join(__dirname, "data", "user.db");
const db = new sqlite3.Database(db_name, err => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful connection to the database 'user.db'");

    const sql_create = `CREATE TABLE IF NOT EXISTS user_management (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    c_number TEXT NOT NULL,
    created_at TIMESTAMP ,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    db.run(sql_create, err => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Successful creation of the 'user_management' table");
    });
});

const pug = new Pug({
    viewPath: './views',
    basedir: './views',
    app: app
});

// Define a route that renders to view the list screnn
router.get('/', async (ctx) => {
    const rows = await new Promise((resolve, reject) => {
        const sql = "SELECT * FROM user_management ORDER BY id"
        db.all(sql, (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
      await ctx.render('index', {  users: rows });
    
  });
  //defining the route that renders the edit page
  router.get('/edit/:id', async (ctx) => {
    const rows = await new Promise((resolve, reject) => {
        const id = ctx.params.id;
        const sql = "SELECT * FROM user_management WHERE id = ?";  
        db.all(sql, id,(err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
      await ctx.render('edit', {model: rows});
  });
  //updating the data in DB
  router.post('/edit/:id', async (ctx) => {
    const rows = await new Promise((resolve, reject) => {
        const id = ctx.params.id;
        const user = [ctx.request.body.first_name, ctx.request.body.last_name, ctx.request.body.email,ctx.request.body.role,ctx.request.body.c_number, id];
        
        const sql = "UPDATE user_management SET first_name=?, last_name=?, email=?,role=?,c_number=? WHERE id = ?";  
     
        db.all(sql, user,(err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    ctx.redirect('/');
  });


   //route to render the create page

   router.get('/create', async (ctx) => {

      await ctx.render('create');   
  });

  //saving the data
  router.post('/create', async (ctx) => {
    const rows = await new Promise((resolve, reject) => {
        const my_date = new Date();
        const formattedDate = my_date.toISOString().slice(0, 10);

        const user = [ctx.request.body.first_name, ctx.request.body.last_name, ctx.request.body.email,ctx.request.body.role,ctx.request.body.c_number,formattedDate];
        const sql= `INSERT INTO user_management (first_name, last_name, email,role,c_number,created_at) VALUES (?,?,?,?,?,?)`
        db.all(sql, user,(err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    ctx.redirect('/');
  });
 
  // to delete
router.post('/delete/:id', async (ctx) => {
    // Call the function
    let othis=this
    await new Promise((resolve, reject) => {
        const id = ctx.request.body.id;
            // Delete the row from the database
            db.run('DELETE FROM user_management WHERE id = ?', [id], async (err) => {
                if (err) {   
                    console.error(err.message);
                    ctx.status = 500;
                    ctx.body = 'Error deleting user';
                    reject()
                }else{
                    resolve()
                }
            });
        });
    ctx.redirect('/');
  });

// Use the router middleware
app.use(router.routes());

//used the port 5000
app.listen(5000, () => {
    console.log("Server started (http://localhost:5000/) !");
});