// socket.io


var app = new Vue({
    el: "#app",
    data() {
        var checkName = (rule, value, callback) => {
            if (!value) {
              return callback(new Error('Please input the name'));
            }
            for (let index in this.minerOptions) {
                if (this.minerOptions[index].name === value) {
                    callback(new Error('The name is already taken.'));
                }
            }
            callback();
        }
        var checkCarryCapacity = (rule, value, callback) => {
            if (!value) {
              return callback(new Error('Please input the carry capacity'));
            }
            if (value > 200) {
                return callback(new Error('maximun of carry capacity is 200'));
            }
            callback();
        }
        var checkTravelSpeed = (rule, value, callback) => {
            if (!value) {
              return callback(new Error('Please input the travel speed'));
            }
            if (value > 200) {
                return callback(new Error('maximun of travel speed is 200'));
            }
            callback();
        }
        var checkMiningSpeed = (rule, value, callback) => {
            if (!value) {
              return callback(new Error('Please input the mining speed'));
            }
            if (value > 200) {
                return callback(new Error('maximun of mining speed is 200'));
            }
            callback();
        }
        return {
            url: 'https://asteroids.dev.mediasia.cn',
            activeTab: 'miners',
            miners: [],
            minerOptions: [],
            asteroids: [],
            planets: [],
            currentTick: 0,
            addMinerDialogFormVisible: false,
            addMinerForm: {},
            addMinerFormRules: {
                name: [
                    { validator: checkName, trigger: 'blur' },
                ],
                carryCapacity: [
                    { validator: checkCarryCapacity, trigger: 'blur' },
                ],
                travelSpeed: [
                    { validator: checkTravelSpeed, trigger: 'blur' },
                ],
                miningSpeed: [
                    { validator: checkMiningSpeed, trigger: 'blur' },
                ],
            },
            targetTypePlanet: 'Planet',
            targetTypeAsteroid: 'Asteroid',
            statusTypeIdle: 0,
            statusTypeTraveling: 1,
            statusTypeMining: 2,
            statusTypeTransfering: 3,
            storeMinerSuccessDialogVisible: false,
            minersListByPlanetDialogVisible: false,
            minersByPlanet: [],
            currentPlanet: {},
            asteroidHasMinerals: 0,
            asteroidDepleted: 1,
        }
    },
    computed: {
    },
    created() {
        socket.on('connect', function() {
            console.log("Connected to WS server", socket.connected);
        });
        socket.on('tick', (data) => {
            this.miners = data.miners;
            this.asteroids = data.asteroids;
            this.planets = data.planets;
            this.currentTick = data.currentTick;
        });
    },
    mounted() {
        
    },
    methods: {
        toggleTab(tab) {
            this.activeTab = tab;
        },
        formatStatus(row, column) {
            let status = '';
            switch (row.status) {
                case this.statusTypeIdle:
                    status = status = 'Idle';
                    break;
                case this.statusTypeTraveling:
                    status = 'Traveling';
                    break;
                case this.statusTypeMining:
                    status = 'Mining';
                    break;
                case this.statusTypeTransfering:
                    status = 'Transfering minerals to planet';
                    break;
                default:
                    status = 'unkonwn';
            }
            return status;
        },
        formatCurrentMiner(row, column) {
            let minertName = '0';
            if (row.currentMiner == null) {
                return minertName;
            }
            this.minerOptions.forEach(element => {
                if (element.id === row.currentMiner) {
                    minertName = element.name
                }
            });
            return minertName;
        },
        findTargetAsteroid(miner) {
            let that = this;

            //find asteroids have been targetd
            let unavaliableAsteroids = [];
            this.miners.forEach(element => {
                if (element.targetType === that.targetTypeAsteroid) {
                    unavaliableAsteroids.push(element.target);
                }
            });
            //find asteroid might be a target
            let avaliableAsteroids = this.asteroids.filter(element => {
                if (unavaliableAsteroids.includes(element._id)) {
                    return false;
                }
                return element.status === that.asteroidHasMinerals;
            });
            //calculate distance
            avaliableAsteroids.map(asteroid => {
                let currDistance = Math.sqrt(Math.pow((asteroid.position.x - miner.x), 2) + Math.pow((asteroid.position.y - miner.y), 2));
                asteroid.distance = currDistance;
            });
            //return
            if (avaliableAsteroids.length <= 1) {
                return avaliableAsteroids;
            }
            //sort by distance asc
            avaliableAsteroids.sort((a,b)=>{ return a.distance - b.distance})
            //return
            return avaliableAsteroids[0];
        },
        requestListMiners() {
            let that = this;
            axios.get(`${this.url}/miners`).then(function (response) {
                that.miners = response.data;
                that.miners.forEach(element => {
                    that.minerOptions.push(
                        {id:element._id, name:element.name}
                    );
                });
            }).catch(function (error) {
                console.log(error);
            })
        },
        createMiner(planetId) {
            this.addMinerDialogFormVisible = true
            this.addMinerForm.planet = planetId;
        },
        initialMinerForm() {
            this.planets.forEach(element => {
                if (element._id == this.addMinerForm.planet) {
                    this.currentPlanet = element;
                }
            });

            if (Object.keys(this.currentPlanet).length === 0) return ;

            this.addMinerForm.x = this.currentPlanet.position.x;
            this.addMinerForm.y = this.currentPlanet.position.y;
            this.addMinerForm.angle = 0;
            this.addMinerForm.status = 0;
            this.addMinerForm.minerals = 0;
            this.addMinerForm.target = this.currentPlanet._id;
            this.addMinerForm.targetType = this.targetTypePlanet;

        },
        storeMiner(formName) {
            let that = this;
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    //construct form
                    that.initialMinerForm();
                    
                    // axios.put(`${that.url}/planets/${that.currentPlanet._id}`, {'minerals':that.currentPlanet.minerals - 1000}).then( res => {

                        axios.post(`${that.url}/miners`, that.addMinerForm).then( res => {
                            that.addMinerDialogFormVisible = false;
                            that.storeMinerSuccessDialogVisible = true;
                            console.log(res);
                        }).catch( res => {
                            console.log('Add miner faild.', res);
                            return false;
                        })

                    // }).catch( res => {
                    //     console.log('Modify planet faild.', res);
                    //     return false;
                    // })
                } else {
                    console.log('Validation Faild.');
                    return false;
                }
            });
        },
        listMinersByPlanet() {
            let that = this;
            this.dialogLoading = true;

            axios.get(`${this.url}/miners?planetId=${this.currentPlanet._id}`).then(function (response) {
                that.minersByPlanet = response.data;
            }).catch(function (error) {
                console.log(error);
            })
            this.dialogLoading = false;
        }
    }
})