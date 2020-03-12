const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const session = require('express-session');
const app = express();

const AdminsecretKey = 'thisisverysecretkey'

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized:
}));

//menggunakan body parser middleware
app.use(bodyParser.json())
app.use(bodyParser.urlenconded({
    extended: true
}))

//cofig connection
const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password: '',
    database:"latihan"
})

//connection database
db.connect((err) => {
    if(err) throw err
    console.log('Database connected')
})

//token admin
const isAuthorized = (req, res, next) => {

    if(typeof(req.headers['x-api-key']) == 'undefined') {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    let token = req.headers['x-api-key']

    jwt.verify(token, AdminsecretKey, (err,decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'

            })
        }
    })
    next()
}
// endpoint untuk login admin
app.post('/login/admin', (request, result) => {
    let data = request.body
    var username = data.username;
    var password = data.password;

    if ( username && password) {
        db.query('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {

            if (results.length > 0) {
                let token = jwt.sign(data.username + '|' + data.password, AdminsecretKey)

                result.json ({
                success: true,
                message: 'Login berhasil, hallo admin!',
                token: token
            });
        
            } else {
                result.json ({
                success: false,
                message: 'username atau password anda salah!!'
            });

            }
            result.end();
        });
    }
});

// endpoint login user
app.post('/login/user', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		db.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/laptop');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});

// endpoint untuk registrasi
app.post('/registrasi', (request, result) => {
    let data = request.body

    let sql = `
        insert into user (nama_user, username, password, alamat, kontak, gender)
        values ('`+data.nama_user+`', '`+data.username+`', '`+data.password+`', '`+data.alamat+`', '`+data.kontak+`', '`+data.gender+`');
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Registrasi berhasil'
    })
})

// endpoint untuk read data user
app.get('/user', isAuthorized, (req, res) => {
    let sql = `
        select id, nama_user, username, alamat, kontak, gender from user
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Data berhasil diambil dari database',
            data: result
        })
    })
})

// endpoint untuk menambahkan data user
app.post('/user', isAuthorized, (request, result) => {
    data = request.body

    data.forEach(element => {
        
        db.query(`
        insert into user (nama_user, username, password, alamat, kontak, gender)
        values ('`+element.nama_user+`', '`+element.username+`', '`+element.password+`', '`+element.alamat+`', '`+element.kontak+`', '`+element.gender+`')
        `, 
        (err, result) => {
            if (err) throw err
        })
    });

    result.json({
        success: true,
        message: 'Data user berhasil ditambahkan'
    })
})

// endpoint untuk mengubah data user
app.put('/user/:id', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
        update user
        set nama_user = '`+data.nama_user+`', username = '`+data.username+`', password = '`+data.password+`', alamat = '`+data.alamat+`', kontak = '`+data.kontak+`', gender = '`+data.gender+`'
        where id = `+request.params.id+`
   `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data berhasil diubah'
    })
})

// endpoint untuk menghapus data user
app.delete('/user/:id', isAuthorized, (request, result) => {
    let sql = `
        delete from user where id = `+request.params.id+`
    `

    db.query(sql, (err, res) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data berhasil dihapus'
    })
})

// endpoint untuk read data laptop
app.get('/buah', (req, res) => {
    let sql = `
        select * from laptop
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Data berhasil diambil dari database',
            data: result
        })
    })
})

// endpoint untuk menambahkan data laptop
app.post('/buah', isAuthorized, (request, result) => {
    data = request.body

    data.forEach(element => {
        
        db.query(`
        insert into laptop (kode_buah, nama_buah, harga_buah)
        values ('`+element.kode_buah+`', '`+element.nama_buah+`', '`+element.harga_buah+`);
        `, 
        (err, result) => {
            if (err) throw err
        })
    });

    result.json({
        success: true,
        message: 'Laptop berhasil ditambahkan'
    })
})

// endpoint untuk mengubah data user
app.put('/buah/:id', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
        update laptop
        set jenis_barang = '`+data.jenis_barang+`', type = '`+data.type+`', warna = '`+data.warna+`', spesifikasi = '`+data.spesifikasi+`', 
        harga = '`+data.harga+`', stock = '`+data.stock+`',  keterangan = '`+data.keterangan+`'
        where id = `+request.params.id+`
   `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data berhasil diubah'
    })
})

// endpoint untuk menghapus data laptop
app.delete('/laptop/:id', isAuthorized, (request, result) => {
    let sql = `
        delete from laptop where id = `+request.params.id+`
    `

    db.query(sql, (err, res) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data berhasil dihapus'
    })
})

// endpoint untuk menambahkan data transaksi
app.post('/transaksi', (req, res) => {
    let data = req.body

    db.query(`
        insert into transaksi (user_id, laptop_id, tanggal_beli)
        values ('`+data.user_id+`', '`+data.laptop_id+`', '`+data.tanggal_beli+`')
    `, 
    
    (err, result) => {
        if (err) throw err
    })

    // mengubah stock pada table laptop, apabila ada transaksi maka stock akan mengurang satu
    db.query(`
        update laptop
        set stock = stock - 1
        where id = '`+data.laptop_id+`'`, 
        (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Laptop has been taked by user"
    })
})

// endpoint untuk read data transaksi sesuai id
app.get('/transaksi/:id', isAuthorized, (req, res) => {
    db.query(`
        select user.nama_user, laptop.jenis_barang, laptop.type, laptop.warna, 
        laptop.spesifikasi, laptop.harga, laptop.keterangan 
        from user
        right join transaksi on user.id = transaksi.user_id
        right join laptop on transaksi.laptop_id = laptop.id
        where transaksi.id = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err

        res.json({
            message: "success get user's laptop",
            data: result
        })
    })
})

// endpoint untuk mengubah data transaksi
app.put('/transaksi/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update transaksi
        set user_id = '`+data.user_id+`', laptop_id = '`+data.laptop_id+`'
        where id = '`+req.params.id+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data berhasil diubah",
            data: result
        })
    })
})

// endpoint untuk menghapus data transaksi
app.delete('/transaksi/:id', isAuthorized, (req, res) => {
    let sql = `
        delete from transaksi
        where id = '`+req.params.id+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "Data berhasil dihapus",
            data: result
        })
    })
})

// port untuk menjalankan program
app.listen(8080, () => {
    console.log('running on port 8080')
})