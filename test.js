const MongoInstancesManager = require("./src/MongoInstanceManager")

const test = async () => {
  try {
    let orderInstance = new MongoInstancesManager("mongodb+srv://giovannicabral:8CpNsTt3y0sRx7eb@order.4tgt0rc.mongodb.net/?retryWrites=true&w=majority&appName=ORDER", "Order", 10);
    let orderDb = await orderInstance.addInstance("order");

    // let op = await orderDb.deleteOne('order', { numero: 2 })

    for (let i = 0; i < 1001; i++) {
      await orderDb.insertOne('order', { numero: i })
      if(i % 100 == 0) {
        await orderDb.close()
      }
    }
    console.log('done')
  } catch (error) {
    console.log(error)
  }
}
test()
