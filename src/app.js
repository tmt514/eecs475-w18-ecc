/**
 *
 * file: index.js
 *
 */

/**
 *
 * Import dependencies
 *
 */
import {Server} from 'hapi';
import {
  PORT,
  CMD_COMPILE_F,
  CMD_RUN_F,
  DIRNAME_F,
  DIRPATH_F,
  PREPROCESS_CODE,
} from './secrets'; 

/**
 *
 * Create server
 *
 */
const server = new Server({ port:PORT });

const meow = async (h) => {
  return h.response(['hello world!']).type('application/json')
}

// current_sale_title
server.route({
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
    return h.view('index', { version: '0.12'}); 
  }
});  

//================== service ====================
//
const fs = require('fs-extra')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const OK = 1
const FAIL = 0
const create_temporary_directory = async (socket, code, dirPath, mainFile) => {
  socket.emit('judge_msg', 'creating temporary directory!')

  socket.emit('judge_msg', 'copying files...')
  fs.mkdirSync(dirPath)
  // write to file
  fs.writeFile(dirPath + "/ec.cpp", code)
  // copying file
  fs.copySync(path.resolve(__dirname, '../files/ec_ops.cpp'), dirPath + '/ec_ops.cpp')
  fs.copySync(path.resolve(__dirname, '../files/uberzahl.cpp'), dirPath + '/uberzahl.cpp')
  fs.copySync(path.resolve(__dirname, '../files/ec_ops.h'), dirPath + '/ec_ops.h')
  fs.copySync(path.resolve(__dirname, '../files/uberzahl.h'), dirPath + '/uberzahl.h')
  fs.copySync(path.resolve(__dirname, `../files/${mainFile}`), dirPath + '/main.cpp')

  socket.emit('judge_msg', 'copying files... OK!')

}

const compile = async (socket, dirPath) => {

  socket.emit('judge_msg', '\nCompiling...')

  const cmd = CMD_COMPILE_F(dirPath)

  try {
    const { stdout, stderr } = await exec(cmd)
  } catch (e) {
		if (e.code == 124) {
      socket.emit('judge_msg', 'Compiler timed out! (10 seconds)')
		}
    if (e.stdout.length > 0) {
      socket.emit('judge_msg', e.stdout.substr(0, 1024))
    }
    throw Error('Compile failed!')
  }
  
  socket.emit('judge_msg', 'Compiling... OK!')
}

const runtest = async (socket, dirPath) => {

  socket.emit('judge_msg', '\nRunning your code...')
  
  const cmd = CMD_RUN_F(dirPath)

  try {
    const { stdout, stderr } = await exec(cmd)
    const output = fs.readFileSync(dirPath + '/RuntimeLog.txt').toString()
    socket.emit('judge_msg', 'Running your code... OK!\n\n')
    socket.emit('judge_msg', output.substr(0, 4096))
  } catch (e) {
		if (e.code == 124) {
      socket.emit('judge_msg', 'Timed out! (60 seconds)')
		} else if (e.stdout.length > 0) {
      socket.emit('judge_msg', e.stdout.substr(0, 1024))
    }
    throw Error('Runtime Error!')
  }

  socket.emit('judge_msg', '\nSome more tests will be added before due... please check this site later :)')

}

//================== server start ======================

const io = require('socket.io')(server.listener);
var seq = 0

io.on('connection', (socket) => {
 
  socket.on('submit', async (code) => {

    // grader issue: replace main function
    code = PREPROCESS_CODE(code)

    
    const today = new Date()
    seq += 1
    const dirname = DIRNAME_F(today, seq)   
    const dirPath = DIRPATH_F(dirname) 
    console.log(`creating temp dir ${dirPath}`)
    try {
      await create_temporary_directory(socket, code, dirPath, 'main.cpp')
      await compile(socket, dirPath)
      await runtest(socket, dirPath)
    } catch (e) {
      console.log(e)
      socket.emit('judge_msg', e.message.substr(0, 1024))
    }
  }) 
});


const Vision = require('vision')
const Handlebars = require('handlebars')

// server config and plugin registering
const provision = async () => {
  await server.register(Vision)

  server.views({
    engines: { html: Handlebars },
    relativeTo: __dirname,
    path: './views',
    layoutPath: './views/layout',
    helpersPath: './views/helpers'
  })

  await server.start()
	console.log('Server running at:', server.info.uri);
}

provision()


