sudo kill $(sudo lsof -t -i:3000)
git pull --prune
npm update
npm install
sudo nohup npm run app