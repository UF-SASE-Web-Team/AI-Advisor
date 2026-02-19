//Endpoint to backend: POST Pdf upload
//Modeled from example.ts

import { uploadPdfSchema } from "@shared/schema/pdfSchema"; //I'm not sure if we have a schema folder
import { apiFetch } from "@shared/utils"; 

export type UploadPdfResponse = {
  ok: boolean; //For file upload status
  pdfId: string; //Unique pdf ID
  filename: string; //Name of file as returned by backend
};

export const uploadPdf = async (file: File): Promise<UploadPdfResponse> => {
  const formData = new FormData(); //Frontend sends form data and backend responds with json?
  formData.append("file", file);

  //Actually nakes the request (HTTP) to backend
  const response = await apiFetch(
    "/api/pdf/upload", //API URL
    { 
        method: "POST", 
        body: formData, 
    },
    uploadPdfSchema
  );
  return response.data;
};

/*

//Function would need to be pasted into the react file that handles pdf uploads not the api file.

import { uploadPdf } from "@/app/apis/pdfupload";

const handleUpload = async (file: File) => {
  try {
    const data = await uploadPdf(file);
    console.log(data);
  } catch (error) {
    console.error("Error uploading PDF:", error);
  }
};

*/