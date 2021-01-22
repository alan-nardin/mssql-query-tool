const sql = require('mssql');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let config = {
    server: '',
    database: '',
    username: '',
    password: '',
    connection_string: ''
}

function startConsole() {

    rl.question(`${config.server}@${config.database}:Query> `, function (query) {

        switch (query.toLowerCase()) {
            case 'quit':
            case 'exit':
                console.clear();
                rl.close();
                break;
            case 'clear':
            case 'cls':
                console.clear();
                startConsole();
                break;
            default: {
                let exec = sql.connect(config.connection_string).then((pool) => { return pool.query(query) });

                exec.then(res => {
                    if (res.recordsets) {
                        res.recordsets.forEach(recordset => { console.table(recordset) });
                    }
                    if (res.rowsAffected) {
                        console.log("\x1b[0m");
                        console.log(`Rows affected: ${res.rowsAffected}`);
                        console.log("\x1b[0m");
                    }
                });

                exec.catch(() => {
                    console.log("\x1b[33m", 'Invalid query');
                    console.log("\x1b[0m");

                });

                exec.finally(() => {
                    sql.close();
                    startConsole();
                });
            }
        }
    });
}

function main() {

    rl.question("Server> ", function (server) {
        rl.question("Database> ", function (database) {
            rl.question("User> ", function (user) {

                rl.setPrompt("Password> ");
                rl.prompt();

                rl.stdoutMuted = true;

                rl.on('line', password => {

                    rl.stdoutMuted = false;
                    rl.history = [];

                    config.server = server;
                    config.database = database;
                    config.user = user;
                    config.password = password;
                    config.connection_string = `Server=${server};Database=${database};User Id=${user};Password=${password}`;

                    let onFailed = () => {
                        console.clear();
                        console.log("\x1b[31m", 'Connection failed');
                        console.log("\x1b[0m");
                        main();
                    }

                    let conn = sql.connect(config.connection_string);

                    conn.then(pool =>{

                        let exec = pool.query('SELECT 1');

                        exec.then(() => {
                            console.clear();
                            console.log("\x1b[32m", 'Successfully connected');
                            console.log("\x1b[0m");
                            startConsole();
                        });
    
                        exec.catch(onFailed);
                        exec.finally(() => { sql.close(); });

                    });

                    conn.catch(onFailed);
                });
            });
        });
    });
}

rl._writeToOutput = (stringToWrite) => {
    rl.output.write(rl.stdoutMuted ? "*" : stringToWrite);
};

rl.on("close", function () {
    process.exit(0);
});

main();