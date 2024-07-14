import 'reflect-metadata';
import express from 'express';
import rateLimit from './middelware/rateLimit';
import concurrencyLimit from './middelware/concurrencyLimit';
import zohoService from './service/zohoServices';
import tokenService from './service/zohoServices'
import router from './routes/getHolidayRouter';
import { checkConnection } from './dbconfig';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api/', rateLimit);
app.use('/api/', concurrencyLimit);
app.use('/api', router);
app.get('/',(req,res)=>{
  res.send({message: "success"});
});

app.post('/api/v2/oauth/token', async (req, res) => {
  const { code } = req.body;
console.log("***",code);
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const { access_token, refresh_token, expires_in } = await zohoService.getAccessTokenFromCode(code);
    console.log("Token received",{access_token,refresh_token,expires_in});
    await tokenService.saveToken(access_token, refresh_token, expires_in);
    return res.json({ access_token, refresh_token, expires_in });
  } catch (error) {
    console.error('Error generating access token:', error);
    res.status(500).json({ error: 'Failed to generate access token' });
  }
});

app.listen(PORT, () => {
  console.log(`listening in port http://localhost:${PORT}`);
  checkConnection();
});
