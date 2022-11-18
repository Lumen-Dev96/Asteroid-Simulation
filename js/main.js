var app = new Vue({
    el: "#app",
    data: {
        url: 'https://asteroids.dev.mediasia.cn',
        activeTab: 'miners',
        miners: [],
        asteroids: [],
        planets: [],
        planetOptions: []
    },
    computed: {

    },
    mounted() {
        let that = this;
        axios.get(`${this.url}/planets`).then(function (response) {
            that.planets = response.data;
            that.planets.forEach(element => {
                that.planetOptions[element._id] = element.name;
            });
        }).catch(function (error) {
            console.log(error);
        })

        axios.get(`${this.url}/miners`).then(function (response) {
            that.miners = response.data;
        }).catch(function (error) {
            console.log(error);
        })

        axios.get(`${this.url}/asteroids`).then(function (response) {
            that.asteroids = response.data;
        }).catch(function (error) {
            console.log(error);
        })

        
    },
    methods: {
        toggleTab(tab) {
            this.activeTab = tab;
        },
        formatPlanetName(row, column) {
            return this.planetOptions[row.planet];
        },
        formatStatus(row, column) {
            let status = '';
            switch (row.status) {
                case 0:
                    status = status = 'Idle';
                    break;
                case 1:
                    status = 'Traveling';
                    break;
                case 2:
                    status = 'Mining';
                    break;
                case 3:
                    status = 'Transfering minerals to planet';
                    break;
                default:
                    status = 'unkonwn';
            }
            return status;
        },
        formatCurrentMiner(row, column) {
            return row.currentMiner == null ? 0 : row.currentMiner;
        }
    }
})