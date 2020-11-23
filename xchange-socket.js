var mysql = require('mysql');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var port = process.env.PORT || 8321;


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var con = mysql.createConnection({
  host: "localhost",
  user: "xchmxsup_xchange",
  password: "KeyFirm123!",
  database: "xchmxsup_xchange"
});

// var con = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   port: 3307,
//   password: "",
//   database: "xchangeb_xchange"
// });

io.on('connection', function(socket) {
	console.log('a user connected');

	sendTransactions(socket);
	sendReservacion(socket);
	actualizarSolicitudes(socket);

	socket.on('actualizarSolicitudes', () => {
		actualizarSolicitudes();
	})

	socket.on('revisandoSolicitud', (data) => {
		revisandoSolicitud(socket, data);
	});

	socket.on('sendReservacion', () => {
		sendReservacion(io);
		sendTransactions(io);
		console.log('Recibi reservacion');
	});

    socket.on('disconnect', function(){
        console.log('user disconnected')
	});
	
	socket.on('updateTasas', () => {
		socket.broadcast.emit('updateTasas');
	});
});

var actualizarSolicitudes = (socket = null) => {
	try{
		con.connect(async () => {
			let sqlQuery = "SELECT * FROM `usuariosprem` WHERE `status` = 0 AND `ocultoVentanilla` = 0 ORDER BY `id` ASC";
			await con.query(sqlQuery, async (err, result) => {
				console.log(result);
				if(socket) {
					socket.emit('actualizarSolicitudes', result);
					console.log("EMITIENDO A RECIEN CONECTADO");
				} else {
					io.emit('actualizarSolicitudes', result);
					console.log("EMITIENDO A TODOS");
				}
			});
		});
	} catch(err) {
		console.log(err);
	}
	
};

var revisandoSolicitud = (socket, data) => {
	// Emitir a todo el mundo que se esta revisando solicitud o dejo de revisar
	socket.broadcast.emit("revisandoSolicitud", data);
};

var sendTransactions = (socket) => {
	con.connect(async function(err) {
		var sql = "SELECT id FROM sucursales";
		await con.query(sql, async function (err, result) {
			await result.forEach(async (currentValue) => {
				let id = currentValue.id;
				new Promise((resolve, reject) => {
					let ventaDolares =  0;
					let compraDolares = 0;
					var sql = "SELECT cantidadTotal, tipoTransaccion FROM citas WHERE statusTransaccion = 'activa' AND sucid = "+currentValue.id;
					con.query(sql, async function (err, resultado) {
						if (err) console.log(err)

						if (resultado.length != 0) {
							await resultado.forEach((currentValue, key, resultado) => {
								switch (currentValue.tipoTransaccion) {
									case 'ventadolares':
										ventaDolares = ventaDolares + parseFloat(currentValue.cantidadTotal)
										break;
									case 'compradolares':
										compraDolares = compraDolares + parseFloat(currentValue.cantidadTotal)
										break;
									default:
										break;
								}
								if (Object.is(resultado.length - 1, key)) {
	       						 	resolve({ sucid: id, ventaDolares: ventaDolares, compraDolares: compraDolares })
	      						}
							});
						} else {
							resolve({ sucid: id, ventaDolares: 0, compraDolares: 0 });
						}
					});
				}).then((successMessage) => {
    				socket.emit('acumulados', successMessage)
				}).catch((reason) => {
    				console.log('Manejar promesa rechazada ('+reason+') aquí.');
    			});
			});
		});
	});
};

var sendReservacion = (socket) => {
	try{
		con.connect(async () => {
			let sqlQuery = "SELECT citas.*, citas.id as citaid, sucs.nombre as sucnombre, sucs.ciudad, sucs.estado, sucs.id as sucid, usr.nombre, usr.apellidomaterno, usr.apellidopaterno, usr.fotoid FROM `citas` INNER JOIN `sucursales` as `sucs` ON `sucs`.`id` = `citas`.`sucid` INNER JOIN `usuariosprem` as `usr` ON `usr`.`idUsuario` = `citas`.`idusuario` WHERE `statusTransaccion` = 'activa'";
			await con.query(sqlQuery, async (err, result) => {
				console.log("RESERVACIONES: ", result);
				socket.emit('reservacion', result);
			});
		})
	} catch(err) {
		console.log(err);
	}
};

http.listen(port, function(){
  console.log('listening on *:' + port)
});

app.get('/updates.json', (req, res) => {  
	/* Just send the file */
	res.sendFile(path.join(__dirname, 'updates.json'));
});

app.get('/updates/:version/:file', (req, res) => {  
	const { version, file } = req.params;

	console.log(req.params);

	/* Just send the file */
	res.download(path.join(__dirname, `updates/${ version }/`,file));
});
