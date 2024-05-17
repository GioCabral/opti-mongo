const MongoInstancesManager = require("./src/MongoInstanceManager")

const test = async () => {
  try {
    let orderInstance = new MongoInstancesManager("mongodb+srv://giovannicabral:8CpNsTt3y0sRx7eb@order.4tgt0rc.mongodb.net/?retryWrites=true&w=majority&appName=ORDER", "Order", 10)
    let orderDb = await orderInstance.addInstance("order")

    await orderDb.deleteOne('order', { numero: undefined })

  } catch (error) {
    console.log(error)
  }
}
test()
