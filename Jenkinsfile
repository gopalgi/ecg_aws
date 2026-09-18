pipeline {
    agent any
    stages {
        stage('Git Pull') {
            steps {
                git branch: 'main', url: 'https://github.com/gopalgi/ecg_aws.git'
            }
        }
        stage('Build & Deploy') {
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose up -d --build'
                sh 'docker ps'
            }
        }
    }
}
