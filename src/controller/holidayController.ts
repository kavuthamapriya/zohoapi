import cron from 'node-cron';
import { Request, Response } from 'express';
import { AppDataSource } from '../dbconfig';
import { LeaveData, LeaveStatus } from '../entites/Data';
import axios from 'axios';

interface CustomRequest extends Request {
  accessToken?: string;
}
export const getLeave = async (req: CustomRequest, res: Response) => {
  const accessToken = req.accessToken;
  console.log("AccessToken", accessToken);
  if (!accessToken) {
    return res.json({ error: 'Access token is missing' });
  }

  try {
    const leaveDataRepository = AppDataSource.getRepository(LeaveData);

    // Fetch data from zoho API
    const response = await axios.get('https://people.zoho.com/people/api/leave/v2/holidays/get', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.data) {
      return res.status(404).json({ error: 'Leave data not found' });
      
    }

    const apiData = response.data;
    console.log("Response data",apiData);

        } catch (error) {
          console.error('Error saving leave data:', error);
          return res.status(500).json({ error: 'Failed to save leave data' });
        }
};
    

export const processData = () => {
  const randomSuccess = Math.random() >= 0.2; 
  return randomSuccess;
};

export const retryFailedLeave = async (accessToken: string) => {
  const leaveDataRepository = AppDataSource.getRepository(LeaveData);
  const failedLeave = await leaveDataRepository.find({ where: { status: LeaveStatus.FAILED } });

  for (const leave of failedLeave) {
    if (leave.retryCount < 5) { // Retry up to 5 times
      try {
        leave.status = LeaveStatus.RETRY;
        leave.retryCount += 1;
        await leaveDataRepository.save(leave); 

        const response = await axios.get('https://people.zoho.com/people/api/leave/v2/holidays/get?', {
          headers: {
            Authorization: `Bearer ${accessToken}`, 
          },
        });

        if (!response.data || !response.data.response.result) {
          leave.status = LeaveStatus.FAILED;
        } else {
          leave.status = LeaveStatus.COMPLETED;
        }
        await leaveDataRepository.save(leave); 

      } catch (error) {
        console.error('Error retrying form data fetch:', error);
        leave.status = LeaveStatus.FAILED;
        await leaveDataRepository.save(leave); 
      }
    } else {
      console.log(`Form with ID ${leave.id} has reached the maximum retry limit.`);
    }
  }
};

export const retryFailedFormsEndpoint = async (req: Request, res: Response) => {
  const accessToken = req.query.accessToken as string;
  if(!accessToken){
    return res.status(400).json({ error: 'Access token is missing'});
  }
  try {
    await retryFailedLeave(accessToken);
    res.status(200).json({ message: 'Retry process completed.' });
  } catch (error) {
    console.error('Error during retry process:', error);
    res.status(500).json({ error: 'Retry process failed.' });
  }
};

// Schedule the retry process to run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled retry process...');
  const accessToken = '1000.c40ace5eccd074edf25147bf0394dc16.d0e923cd78e3a5d358dc3285644adc8d';

  await retryFailedLeave(accessToken);
});

export const getLeaveById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const leaveDataRepository = AppDataSource.getRepository(LeaveData);
    const leave = await leaveDataRepository.findOne({ where: { id: parseInt(id) } });

    if (!leave) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(leave);
  } catch (error) {
    console.error('Error fetching form data by ID:', error);
    res.status(500).json({ error: 'Failed to fetch form data' });
  }
};

export const getAllForms = async (req: Request, res: Response) => {
  try {
    const leaveDataRepository = AppDataSource.getRepository(LeaveData);
    const leave = await leaveDataRepository.find();
  
    res.json(leave);
  } catch (error) {
    console.error('Error fetching all forms:', error);
    res.status(500).json({ error: 'Failed to fetch all forms' });
  }
};
