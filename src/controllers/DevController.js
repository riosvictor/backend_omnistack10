const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');


module.exports = {
    async index(request, response) {
        const devs = await Dev.find();

        return response.json(devs);
    },


    async store(request, response) {
        const { github_username, techs, latitude, longitude } = request.body;
    
        let dev = await Dev.findOne({ github_username })

        if(!dev){
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
            
            const { name = login, avatar_url, bio } = apiResponse.data;
            const techsArray = parseStringAsArray(techs);
        
            const location = {
                type: 'Point',
                coordinates: [longitude, latitude],
            }
        
            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location,
            });

            //
            const sendSocketMessageTo = findConnections(
                dev.location.coordinates,
                dev.techs,
            )

            console.log(sendSocketMessageTo);
            sendMessage(sendSocketMessageTo, 'new_dev', dev);
        }

        return response.json(dev);
    },

    async show(request, response){
        const dev = await Dev.findById(request.params.id);

        return response.json(dev);
    },

    async update(request, response){
        const dev = await Dev.findByIdAndUpdate(request.params.id, request.body, { new: true });

        return response.json(dev);
    },

    async destroy(request, response){
        await Dev.findByIdAndRemove(request.params.id);

        return response.send();
    }
}