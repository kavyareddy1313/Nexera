pipeline {
    agent any

    environment {
        // Docker registry configuration
        DOCKER_REGISTRY_USER = 'kavya00'
        DOCKER_CREDENTIALS_ID = 'jenkins-pipeline'

        // VPS/Deployment server configuration
        SSH_CREDENTIALS_ID = 'vps-deploy-key'
        SERVER_USER = 'ubuntu'
        SERVER_HOST = '43.204.143.166'

        // Frontend Build Args
        VITE_API_URL = "http://${SERVER_HOST}:4000/api/v1"
        VITE_SOCKET_URL = "http://${SERVER_HOST}:4000"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo '=== Checking Out Source Code ==='
                checkout scm
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    echo '=== Logging into Docker Hub & Building Images ==='
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"

                        // Build and Push Frontend
                        echo 'Building Nexera Frontend Image...'
                        sh """
                            docker build \
                              --build-arg VITE_API_URL=${env.VITE_API_URL} \
                              --build-arg VITE_SOCKET_URL=${env.VITE_SOCKET_URL} \
                              -t ${env.DOCKER_REGISTRY_USER}/nexera-frontend:latest ./Frontend
                        """
                        echo 'Pushing Nexera Frontend Image...'
                        sh "docker push ${env.DOCKER_REGISTRY_USER}/nexera-frontend:latest"

                        // Build and Push Backend
                        echo 'Building Nexera Backend Image...'
                        sh "docker build -t ${env.DOCKER_REGISTRY_USER}/nexera-backend:latest ./Backend"
                        echo 'Pushing Nexera Backend Image...'
                        sh "docker push ${env.DOCKER_REGISTRY_USER}/nexera-backend:latest"
                    }
                }
            }
        }

        stage('Deploy to VPS') {
            steps {
                script {
                    echo '=== Deploying to VPS ==='
                    withCredentials([sshUserPrivateKey(credentialsId: env.SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh """
                            ssh -i \$SSH_KEY -o StrictHostKeyChecking=no ${env.SERVER_USER}@${env.SERVER_HOST} '
                                cd ~
                                if [ ! -d "Nexera" ]; then
                                    git clone https://github.com/kavyareddy1313/Nexera.git
                                fi
                                cd Nexera
                                git pull origin main
                                docker compose pull
                                docker compose up -d
                                docker image prune -f
                            '
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo '=== Workspace Clean Up ==='
            cleanWs()
        }
        success {
            echo 'Nexera Pipeline Succeeded & Deployed!'
        }
        failure {
            echo 'Nexera Pipeline Failed. Check console logs.'
        }
    }
}
