
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { firebaseConfig } from '../firebaseConfig';

let app: firebase.app.App;
try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw new Error("Firebase initialization failed. Please check your firebaseConfig.ts and console for errors.");
}


const storage = firebase.storage();

export const uploadImageAndGetURL = async (
  file: File | Blob, 
  path: string = 'images'
): Promise<string> => {
  if (!file) {
    throw new Error('업로드할 파일이 없습니다.');
  }

  let baseName: string;
  if (file instanceof File) {
    const sanitizedName = file.name.replace(/\s+/g, '_');
    baseName = encodeURIComponent(sanitizedName);
  } else {
    baseName = 'image.jpg';
  }
  const fileName = `${path}/${Date.now()}-${baseName}`;
  
  const storageRef: firebase.storage.Reference = storage.ref(fileName);

  try {
    console.log(`Firebase Storage에 파일 업로드 시작: ${fileName}`);
    const snapshot = await storageRef.put(file); 
    console.log('Firebase Storage에 성공적으로 업로드됨:', snapshot.metadata.fullPath);
    const downloadURL = await snapshot.ref.getDownloadURL(); 
    console.log('파일 다운로드 URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Firebase Storage 업로드 오류:', error);
    throw new Error(`이미지 업로드 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const uploadBase64ImageAndGetURL = async (
  base64String: string,
  path: string = 'images'
): Promise<string> => {
  if (!base64String) {
    throw new Error('업로드할 base64 문자열이 없습니다.');
  }
  const MimeTypeMatch = base64String.match(/^data:(image\/(jpeg|png|webp));base64,/);
  const mimeType = MimeTypeMatch ? MimeTypeMatch[1] : 'image/jpeg';
  const extension = MimeTypeMatch ? MimeTypeMatch[2] : 'jpg';

  const fileName = `${path}/${Date.now()}-uploaded.${extension}`;
  const storageRef: firebase.storage.Reference = storage.ref(fileName);
  
  const pureBase64 = base64String.substring(base64String.indexOf(',') + 1);

  try {
    console.log(`Firebase Storage에 Base64 이미지 업로드 시작: ${fileName}`);
    const snapshot = await storageRef.putString(pureBase64, firebase.storage.StringFormat.BASE64, { contentType: mimeType }); 
    console.log('Firebase Storage에 Base64 이미지 성공적으로 업로드됨:', snapshot.metadata.fullPath);
    const downloadURL = await snapshot.ref.getDownloadURL(); 
    console.log('Base64 이미지 다운로드 URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Firebase Storage Base64 이미지 업로드 오류:', error);
    throw new Error(`Base64 이미지 업로드 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export function base64ToBlob(base64: string, contentType: string = ''): Blob {
    const pureBase64 = base64.split(',')[1];
    if (!pureBase64) {
      throw new Error("Invalid Base64 string: missing data part.");
    }
    const byteCharacters = atob(pureBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
}

export { storage };
