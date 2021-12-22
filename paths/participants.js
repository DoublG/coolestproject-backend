module.exports = function(models, database) {
  
  const operations = {
    POST
  };
    
  async function POST(req, res) {
    const user = req.user || null;
    await database.createVoucher(user.id);
    res.status(200).send(null);
  }
  
  return operations;
};