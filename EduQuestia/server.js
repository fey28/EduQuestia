const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;


app.use(cors());
app.options('*', cors()); 


app.use(express.json());


const prePrompt = `
Ești un profesor care trebuie să creeze întrebări de tip grilă cu raspuns unic pentru elevii săi. Fiecare întrebare trebuie să fie clară, concisă și să acopere aspecte esențiale ale materiei. Asigură-te că întrebările sunt bine structurate și specifică răspunsurile corecte pentru fiecare întrebare.

Formatul pe care il vei primi de la utilizator va fi:
"{\"subject\":\"MATERIA_TESTULUI\",\"numQuestions\":"NUMARUL_INTREBARILOR_CE_TREBUIE_GENERATE",\"questions\":[{\"question\":\"INPUT_PE_BAZA_CARUIA_SE_GENEREAZA_INTREBAREA\",\"difficulty\":\"DIFICULTATEA_ALEASA\",\"number_answers\":\"NUMAR_RASPUNSURI\"}]}\"

RESPECTA numarul intrebarilor ce trebuie create si ca explicatia pe care o vei trimite este concisa.


Make sure you make the exact number of answers to an answer as specified in the value of "number_answers" of each question. (questions might have different number of answers)

Make sure the questions made are UNIQE and not the same as the other ones that you have generated.
For example, dont use the same values that you would use normally, i need the questions to be different from others.

Make sure the ouput is in PLAIN JSON like the one below(do not use \n or '''json or other similiar things):

{
  "questions": [
    {
      "question": "Care este valoarea lui x în ecuația 2x + 3 = 7?",
      "options": {
        "1": "1",
        "2": "2",
        "3": "3",
        "4": "4"
      },
      "answer": "2",
      "explanation": "Scădem 3 din ambele părți ale ecuației: 2x = 4. Împărțim ambele părți la 2: x = 2."
    },
    {
      "question": "Capitala Franței este _______.",
      "options": {
        "1": "Madrid",
        "2": "Paris",
      },
      "answer": "2",
        "explanation": "Paris este capitala Franței. Madrid este capitala Spaniei, Berlin este capitala Germaniei, iar Roma este capitala Italiei."
    }
  ]
}


Folosind această structură, creează noi întrebări pe baza inputului utilizatorului:
`;


async function generateContentFromPrompt(prompt, projectId = 'ID_PROIECT') {
  const vertexAI = new VertexAI({ project: projectId, location: 'europe-west3' });

  const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash-001',
  });

  const combinedPrompt = prePrompt + prompt;

  const resp = await generativeModel.generateContent(combinedPrompt);
  const contentResponse = await resp.response;
  let generatedText = contentResponse.candidates[0].content.parts[0].text;

  return generatedText;
}


const ensureUsersFile = () => {
  const usersPath = path.join(__dirname, 'users.json');

  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, JSON.stringify({}));
  } else {
    try {
      const data = fs.readFileSync(usersPath, 'utf8');
      JSON.parse(data); 
    } catch (error) {
      fs.writeFileSync(usersPath, JSON.stringify({})); 
    }
  }
};

ensureUsersFile();


const upload = multer({ dest: 'uploads/' });


app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).send({ error: 'Prompt is required' });
  }

  try {
    const generatedText = await generateContentFromPrompt(prompt);
    res.send({ generatedText });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send({ error: 'Failed to generate content' });
  }
});

app.post('/quiz', (req, res) => {
  const quizData = req.body;
  const { username } = quizData; 

  if (!quizData || !quizData.title || !username) {
    return res.status(400).send({ error: 'Quiz data, title, and username are required' });
  }

  const quizzesDir = path.join(__dirname, 'quizzes');

  if (!fs.existsSync(quizzesDir)) {
    fs.mkdirSync(quizzesDir);
  }

  const fileName = `${quizData.title}.json`;
  const filePath = path.join(quizzesDir, fileName);

  if (fs.existsSync(filePath)) {
    return res.status(400).send({ error: 'A quiz with this name already exists' });
  }

  fs.writeFile(filePath, JSON.stringify(quizData, null, 2), (err) => {
    if (err) {
      console.error('Error writing quiz data:', err);
      return res.status(500).send({ error: 'Failed to save quiz data' });
    }

    fs.readFile('users.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading users file:', err);
        return res.status(500).send({ error: 'Failed to read users file' });
      }

      const users = JSON.parse(data);
      if (!users[username].quizzes) {
        users[username].quizzes = [];
      }
      users[username].quizzes.push(fileName);

      fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
        if (err) {
          console.error('Error updating users file:', err);
          return res.status(500).send({ error: 'Failed to update users file' });
        }

        res.send({ message: 'Quiz data saved successfully', fileName });
      });
    });
  });
});

app.get('/quiz-names', (req, res) => {
  const quizzesDir = path.join(__dirname, 'quizzes');

  fs.readdir(quizzesDir, (err, files) => {
    if (err) {
      console.error('Error reading quizzes directory:', err);
      return res.status(500).send({ error: 'Failed to read quizzes directory' });
    }

    const quizFiles = files.filter(file => path.extname(file) === '.json');
    res.send({ quizFiles });
  });
});

app.post('/quiz-info', (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    return res.status(400).send({ error: 'File name is required' });
  }

  const filePath = path.join(__dirname, 'quizzes', `${fileName}`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send({ error: 'File not found' });
      }
      console.error('Error reading quiz file:', err);
      return res.status(500).send({ error: 'Failed to read quiz file' });
    }

    res.send(JSON.parse(data));
  });
});

app.get('/lesson-names', (req, res) => {
  const lessonsDir = path.join(__dirname, 'lectii');

  if (!fs.existsSync(lessonsDir)) {
    fs.mkdirSync(lessonsDir);
  }

  fs.readdir(lessonsDir, (err, files) => {
    if (err) {
      console.error('Error reading lessons directory:', err);
      return res.status(500).send({ error: 'Failed to read lessons directory' });
    }

    const lessonFiles = files.filter(file => path.extname(file) === '.pdf');
    res.send({ lessonFiles });
  });
});

app.post('/lesson-creator', upload.single('file'), (req, res) => {
  const lessonsDir = path.join(__dirname, 'lectii');

  if (!fs.existsSync(lessonsDir)) {
    fs.mkdirSync(lessonsDir);
  }

  const file = req.file;
  const title = req.body.title;
  if (!file || !title) {
    return res.status(400).send({ error: 'File and title are required' });
  }

  const destPath = path.join(lessonsDir, `${title}.pdf`);

  if (fs.existsSync(destPath)) {
    return res.status(400).send({ error: 'A file with that name already exists' });
  }

  fs.rename(file.path, destPath, (err) => {
    if (err) {
      console.error('Error saving lesson file:', err);
      return res.status(500).send({ error: 'Failed to save lesson file' });
    }

    res.send({ success: true, message: 'Lesson uploaded successfully' });
  });
});

app.post('/lesson-info', (req, res) => {
  let { fileName } = req.body;

  if (!fileName) {
    return res.status(400).send({ error: 'File name is required' });
  }

  if (!fileName.endsWith('.pdf')) {
    fileName += '.pdf';
  }

  const filePath = path.join(__dirname, 'lectii', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users file:', err);
      return res.status(500).send({ error: 'Failed to read users file' });
    }

    const users = JSON.parse(data);

    if (users[username] && users[username].password === password) {
      res.send({ success: true, rank: users[username].rank, quizzes: users[username].quizzes || [] });
    } else {
      res.send({ success: false });
    }
  });
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users file:', err);
      return res.status(500).send({ error: 'Failed to read users file' });
    }

    const users = JSON.parse(data);

    if (users[username]) {
      return res.status(400).send({ error: 'Username already exists' });
    }

    users[username] = { password, rank: 'Elev', quizzes: [] };

    fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
      if (err) {
        console.error('Error writing users file:', err);
        return res.status(500).send({ error: 'Failed to save user' });
      }

      res.send({ success: true });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
