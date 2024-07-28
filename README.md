# EduQuestia - Server Setup

Downloadezi folderul "EduQuestia"

Downloadezi https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe si te asiguri ca este setata instalarea in folderul "EduQuestia"

![image](https://github.com/user-attachments/assets/61182a9b-32bf-4bc3-b46e-33d2e4cda893)


Iti faci cont pe https://console.cloud.google.com/ (vei avea credit 300$ gratis timp de 90 de zile)

![image](https://github.com/user-attachments/assets/e3d85021-0b62-45b6-b813-e88d3ae3300c)


Activezi API-urile:
 - https://console.cloud.google.com/apis/library/aiplatform.googleapis.com 
 - https://console.cloud.google.com/apis/library/cloudaicompanion.googleapis.com

Deschizi CMD-ul si accesezi path-ul folderului (de ex: C:\Users\Mihnea\Desktop\EduQuestia)

Apoi scrie in CMD:
 - npm install @google-cloud/vertexai@latest express cors multer
 - gcloud auth application-default login

Te loghezi cu contul de Google pe care ai si contul de Google Cloud
La ce sa ai grija:
- Serverul pe care il accesezi pe Google Cloud (recomand europe-west3)
- ID-ul proiectului (poti face rost de el de pe https://console.cloud.google.com/)
![image](https://github.com/user-attachments/assets/6ae3a591-076d-4d3a-8be0-bfb7d5fdbbe9)

Dupa ce termini de setat tot va trebui sa pui ID-ul proiectului in "server.js"

![image](https://github.com/user-attachments/assets/3ee555a7-f133-472d-90bb-db0482eaad52)

Asa ar trebui sa arate folderul "EduQuestia"

![image](https://github.com/user-attachments/assets/994f864f-b844-4010-a394-2f32324259bd)

Apoi scrie in CMD: node server.js

![image](https://github.com/user-attachments/assets/53dcbc7f-511a-4932-b68e-4f64b2520ce9)

Asta este tot pentru server setup.

Pentru a putea creea Quizzuri/Lectii va trebui sa modifici rank-ul userului in users.json, din "Elev" in "Profesor

![image](https://github.com/user-attachments/assets/77781f04-bb05-41b7-a01e-33656ae43cd8)

