pipeline {
    agent any
    environment {
        FRONTEND_IMAGE = "dubeygpl/ecg-frontend:latest"
        BACKEND_IMAGE = "dubeygpl/ecg-backend:latest"
    }
    stages {
        stage('Prepare Env') {
            steps {
                sh '''
                echo "Copying .env file..."
                cp /home/ubuntu/ecg_aws/backend/.env ./backend/.env
                cat ./backend/.env
                '''
            }
        }
        stage('Build') {
            steps {
                sh '''
                    docker-compose down || true
                    docker-compose up -d --build
                    docker images
                '''
            }
        }
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh '''
                        echo $PASS | docker login -u $USER --password-stdin
                        docker tag ecg-aws-final_frontend $FRONTEND_IMAGE
                        docker tag ecg-aws-final_backend $BACKEND_IMAGE
                        docker push $FRONTEND_IMAGE
                        docker push $BACKEND_IMAGE
                    '''
                }
            }
        }
        stage('Verify Deploy') {
            steps {
                sh '''
                docker ps
                sleep 5
                docker logs ecg-backend --tail 20
                '''
            }
        }
    }
}
