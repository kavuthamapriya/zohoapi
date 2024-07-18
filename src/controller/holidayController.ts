import cron from "node-cron";
import { Request, Response } from "express";
import { AppDataSource } from "../dbconfig";
import { LeaveData, LeaveStatus } from "../entites/Data";
import axios from "axios";

interface CustomRequest extends Request {
  accessToken?: string;
}

export const getLeave = async (req: CustomRequest, res: Response) => {
  const accessToken = req.accessToken;
  console.log("AccessToken", accessToken);
  if (!accessToken) {
    return res.json({ error: "Access token is missing" });
  }

  try {
    const leaveDataRepository = AppDataSource.getRepository(LeaveData);

    // Fetch data from Zoho API (holiday API)
    const response = await axios.get(
      "https://people.zoho.com/people/api/leave/v2/holidays/get",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Response data:", response.data); 

    if (!response.data) {
      return res.status(404).json({ error: "Leave data not found" });
    }

    // Assuming response.data is an object with a `holidays` array
    const apiData = response.data.holidays;
    if (!Array.isArray(apiData)) {
      return res.status(500).json({ error: "Invalid data format received from Zoho API" });
    }

    for (const api of apiData) {
      const locationId = api.locationId ? parseInt(api.locationId, 10) : 0;
      const Remarks = api.Remarks || "";
      const Name = api.Name ? JSON.stringify(api.Name) : "";

      if (!isNaN(locationId) && Remarks && Name) {
        try {
          const leaveDataAdded = new LeaveData();
          leaveDataAdded.locationId = locationId;
          leaveDataAdded.Remarks = Remarks;
          leaveDataAdded.Name = Name;
          leaveDataAdded.status = LeaveStatus.ADDED;
          await leaveDataRepository.save(leaveDataAdded);

          const leaveDataInProgress = new LeaveData();
          leaveDataInProgress.locationId = locationId;
          leaveDataInProgress.Remarks = Remarks;
          leaveDataInProgress.Name = Name;
          leaveDataInProgress.status = LeaveStatus.IN_PROGRESS;
          await leaveDataRepository.save(leaveDataInProgress);

          const processedStatus = processData();
          const leaveDataCompletedOrFailed = new LeaveData();
          leaveDataCompletedOrFailed.locationId = locationId;
          leaveDataCompletedOrFailed.Remarks = Remarks;
          leaveDataCompletedOrFailed.Name = Name;
          leaveDataCompletedOrFailed.status = processedStatus
            ? LeaveStatus.COMPLETED
            : LeaveStatus.FAILED;
          await leaveDataRepository.save(leaveDataCompletedOrFailed);
        } catch (error) {
          console.error("Error saving leave data:", error);
          return res.status(500).json({ error: "Failed to save leave data" });
        }
      }
    }

    return res.json({ message: "Holiday processed successfully" });
  } catch (error) {
    console.error("Error fetching leave data:", error);
    return res.status(500).json({ error: "Failed to fetch leave data" });
  }
};

export const processData = () => {
  const randomSuccess = Math.random() >= 0.2;
  return randomSuccess;
};

export const retryFailedLeave = async (accessToken: string) => {
  const leaveDataRepository = AppDataSource.getRepository(LeaveData);
  const failedLeave = await leaveDataRepository.find({
    where: { status: LeaveStatus.FAILED },
  });

  for (const leave of failedLeave) {
    if (leave.retryCount < 5) {
      // Retry up to 5 times
      try {
        leave.status = LeaveStatus.RETRY;
        leave.retryCount += 1;
        await leaveDataRepository.save(leave);

        const response = await axios.get(
          "https://people.zoho.com/people/api/leave/v2/holidays/get?",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.data || !response.data.response.result) {
          leave.status = LeaveStatus.FAILED;
        } else {
          leave.status = LeaveStatus.COMPLETED;
        }
        await leaveDataRepository.save(leave);
      } catch (error) {
        console.error("Error retrying holiday data fetch:", error);
        leave.status = LeaveStatus.FAILED;
        await leaveDataRepository.save(leave);
      }
    } else {
      console.log(
        `Holiday with ID ${leave.id} has reached the maximum retry limit.`
      );
    }
  }
};

export const retryFailedHolidaysEndpoint = async (
  req: Request,
  res: Response
) => {
  const accessToken = req.query.accessToken as string;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is missing" });
  }
  try {
    await retryFailedLeave(accessToken);
    res.status(200).json({ message: "Retry process completed." });
  } catch (error) {
    console.error("Error during retry process:", error);
    res.status(500).json({ error: "Retry process failed." });
  }
};

// Schedule the retry process to run every hour (access token)
cron.schedule("0 * * * *", async () => {
  console.log("Running scheduled retry process...");
  const accessToken =
    "1000.c40ace5eccd074edf25147bf0394dc16.d0e923cd78e3a5d358dc3285644adc8d";

  await retryFailedLeave(accessToken);
});

export const getLeaveById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const leaveDataRepository = AppDataSource.getRepository(LeaveData);
    const leave = await leaveDataRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!leave) {
      return res.status(404).json({ error: "Leave data not found" });
    }

    res.json(leave);
  } catch (error) {
    console.error("Error fetching leave data by ID:", error);
    res.status(500).json({ error: "Failed to fetch leave data" });
  }
};

export const getAllHoliday = async (req: Request, res: Response) => {
  try {
    const leaveDataRepository = AppDataSource.getRepository(LeaveData);
    const leave = await leaveDataRepository.find();

    res.json(leave);
  } catch (error) {
    console.error("Error fetching all data:", error);
    res.status(500).json({ error: "Failed to fetch all data" });
  }
};
