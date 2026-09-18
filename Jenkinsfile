pipeline {
    agent any
    stages {
        stage('Clone') {
            steps { git branch: 'main', url: 'https://github.com/gopalgi/ecg_aws.git' }
        }
        stage('Build Backend') {
            steps { sh 'docker build -t ecg-backend:${BUILD_NUMBER} ./backend' }
        }
        stage('Deploy') {
            steps {
                sh 'docker rm -f ecg-app || true'
                sh 'docker run -d --name ecg-app -p 3000:3000 ecg-backend:${BUILD_NUMBER}'
            }
        }
    }
}
