const express = require('express')
const bodyParser = require('body-parser')
const {graphqlHTTP} = require('express-graphql')
const {buildSchema} = require('graphql')
const mongoose = require('mongoose')

const Event = require('./models/event')

const app = express()

app.use(bodyParser.json())

app.use('/graphql', graphqlHTTP({
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
  rootValue: {
    events: () => {
      return Event.find().then(events => {
        return events.map(event => {
          return {...event._doc, _id: event.id.toString()}
        })
      }).catch(e => {
        throw e
      })
    },
    createEvent: (args) => {
      const {title, description, price, date} = args.eventInput
      const event = new Event({
        title,
        description,
        price,
        date: new Date(date)
      })
      return event.save().then(result => {
        console.log(result)
        return {...result._doc, _id: result.id.toString()}
      }).catch(e => {
        console.log(e)
        throw e
      })
    }
  },
  graphiql: true
}))

mongoose
  .connect(
    `mongodb+srv://${
      process.env.MONGO_USER}:${
      process.env.MONGO_PASSWORD}@linkscluster.qpu21.mongodb.net/${
      process.env.MONGO_DB}?retryWrites=true&w=majority`
  ).then(() => {
    console.log('connection success')
    app.listen(3000)
  }).catch(e => {
    console.log(e)
  })
