import { WAMessage, AnyMessageContent, WAMediaUpload } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import mime from "mime-types";
import AWS from 'aws-sdk'

interface Request {
  imageFormated: Express.Multer.File;
  ticket: Ticket;
  body?: string;
  timeSendMessage?: number
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio} -vn -ab 128k -ar 44100 -f ipod ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

//deixar comentado esta função caso apareça a necessidade de converter o audio para .ogg
// let audioOggPath : any
// const processAudioBuffer = async (audio: any, body: any): Promise<void> => {
//   const outputAudio = `${publicFolder}/${new Date().getTime()}.ogg`;
//   audioOggPath = outputAudio
//   await new Promise<void>((resolve, reject) => {
//     fs.writeFile(audio.path, audio.buffer, (err) => {
//       if (err) {
//         console.error('Erro ao salvar o arquivo de áudio:', err);
//         reject(err);
//       } else {
//         resolve();
//       }
//     });
//   });

//   return new Promise<void>((resolve, reject) => {
//     const command = `${ffmpegPath.path} -i ${audio.path} -vn -ab 128k -ar 44100 -f ogg ${outputAudio} -y`;

//     exec(command, (error, _stdout, stderr) => {
//       if (error) {
//         fs.unlinkSync(outputAudio);
//         reject(new Error(`Erro durante a conversão de áudio: ${stderr}`));
//       } else {
//         resolve();
//       }
//     });

//     //childProcess.stdin?.write(audio);
//     //childProcess.stdin?.end();
//   });
// };

export const verifyMediaType = async (
  buffer: any,
  fileName: string,
  mimetype: string
): Promise<any> => {
  const typeMessage = mimetype.split("/")[0];

  try {
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: buffer,
        fileName: fileName
      };
    } else if (typeMessage === "audio") {
      const typeAudio = fileName.includes("audio-record-site");
      if (typeAudio) {
        options = {
          audio: buffer,
          mimetype: "audio/mpeg",
          ptt: true
        };
      } else {
        options = {
          audio: buffer,
          mimetype: "audio/mpeg",
          ptt: true
        };
      }
    } else if (typeMessage === "document") {
      options = {
        document: buffer,
        caption: fileName,
        fileName: fileName,
        mimetype: mimetype
      };
    } else if (typeMessage === "application") {
      options = {
        document: buffer,
        caption: fileName,
        fileName: fileName,
        mimetype: mimetype
      };
    } else {
      options = {
        image: buffer,
        caption: fileName
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string
): Promise<any> => {
  const mimeType = mime.lookup(pathMedia);
  const typeMessage = mimeType.split("/")[0];

  try {
    if (!mimeType) {
      throw new Error("Invalid mimetype");
    }
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        fileName: fileName
      };
    } else if (typeMessage === "audio") {
      const typeAudio = fileName.includes("audio-record-site");
      const convert = await processAudio(pathMedia);
      if (typeAudio) {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: typeAudio ? "audio/mp4" : mimeType,
          ptt: true
        };
      } else {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: typeAudio ? "audio/mp4" : mimeType,
          ptt: true
        };
      }
    } else if (typeMessage === "document") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: fileName,
        fileName: fileName,
        mimetype: mimeType
      };
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: fileName,
        fileName: fileName,
        mimetype: mimeType
      };
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: fileName
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  imageFormated,
  ticket,
  body,
  timeSendMessage
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);
    const typeMessage = imageFormated.mimetype.split("/")[0];
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: imageFormated.buffer,
        caption: body,
        fileName: imageFormated.originalname
      };
    } else if (typeMessage === "audio") {
      const typeAudio = imageFormated.originalname.includes("audio-record-site");
      if (typeAudio) {
        options = {
          audio: imageFormated.buffer,
          mimetype: "audio/mpeg",
          ptt: true
        };
      } else {
        options = {
          audio: imageFormated.buffer,
          mimetype: typeAudio ? "audio/mp4" : imageFormated.mimetype,
        };
      }
    } else if (typeMessage === "document") {
      options = {
        document: imageFormated.buffer,
        caption: body,
        fileName: imageFormated.originalname,
        mimetype: imageFormated.mimetype
      };
    } else if (typeMessage === "application") {
      options = {
        document: imageFormated.buffer,
        caption: body,
        fileName: imageFormated.originalname,
        mimetype: imageFormated.mimetype
      };
    } else if (typeMessage === "image") {
      options = {
        image: imageFormated.buffer,
        caption: body
      };
    } else {
      options = {
        image: imageFormated.buffer,
        caption: body
      };
    }

    let timeSendMessageFormated = timeSendMessage * 1000
    await new Promise(resolve => setTimeout(resolve, timeSendMessageFormated));
    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
      {
        ...options
      }
    );

    await ticket.update({ lastMessage: imageFormated.filename });

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
