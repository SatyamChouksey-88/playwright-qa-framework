pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 45, unit: 'MINUTES')
  }

  environment {
    CI = 'true'
    TEST_ENV = "${params.TEST_ENV ?: 'prod'}"
  }

  parameters {
    choice(name: 'TEST_ENV', choices: ['prod', 'staging', 'dev'], description: 'Target environment')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install --with-deps'
      }
    }

    stage('Validate') {
      steps {
        sh 'npm run validate'
      }
    }

    stage('Test') {
      steps {
        sh 'npx playwright test'
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'junit-results.xml'
      archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
    }
  }
}
