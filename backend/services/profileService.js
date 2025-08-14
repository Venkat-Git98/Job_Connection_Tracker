// Profile service for managing user profile information
class ProfileService {
  constructor() {
    // Venkat's comprehensive profile based on resume and requirements
    this.userProfile = {
      personalInfo: {
        name: 'Venkat',
        fullName: 'Shanmugam Venkatesh',
        email: 'svenkatesh.js@gmail.com',
        linkedin: 'https://www.linkedin.com/in/svenkatesh-js/',
        github: 'https://github.com/GitHub/',
        portfolio: 'https://venkatjs.netlify.app/',
        location: 'United States'
      },
      
      professional: {
        currentRole: 'Machine Learning Engineer',
        experience: '4+ years in ML/AI',
        seniority: 'Senior',
        
        coreSkills: [
          'Deep Learning', 'Computer Vision', 'Machine Learning', 'MLOps',
          'Python', 'TensorFlow', 'PyTorch', 'Neural Networks',
          'Image Processing', 'Model Deployment', 'Data Engineering'
        ],
        
        technicalSkills: [
          'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Production ML Systems',
          'Model Optimization', 'Real-time Inference', 'Model Monitoring',
          'Data Pipelines', 'Feature Engineering', 'A/B Testing'
        ],
        
        specializations: [
          'Computer Vision applications in healthcare and autonomous systems',
          'Deep learning model optimization and deployment at scale',
          'MLOps and production ML infrastructure design',
          'Real-time inference systems for high-throughput applications',
          'Model monitoring, performance optimization, and reliability'
        ],
        
        industries: [
          'Healthcare Technology', 'Autonomous Systems', 'Fintech', 
          'Computer Vision', 'AI/ML Platforms', 'EdTech'
        ],
        
        achievements: [
          'Built and deployed ML models serving millions of users in production',
          'Reduced model inference time by 60% through optimization and architecture improvements',
          'Led cross-functional teams in ML product development and deployment',
          'Designed and implemented MLOps pipelines reducing deployment time by 80%',
          'Published research in computer vision applications for healthcare',
          'Mentored junior engineers and established ML best practices'
        ],
        
        projectTypes: [
          'End-to-end ML system design and implementation',
          'Computer vision applications for medical imaging',
          'Real-time object detection and tracking systems',
          'MLOps infrastructure and deployment automation',
          'Model performance monitoring and optimization',
          'Data pipeline architecture for large-scale ML'
        ]
      },
      
      personal: {
        motivation: 'Passionate about building real-world ML systems that create meaningful impact in healthcare, autonomous systems, and emerging technologies',
        
        values: [
          'Innovation and Technical Excellence',
          'Collaborative Problem Solving',
          'Continuous Learning and Growth',
          'Ethical AI Development',
          'Mentorship and Knowledge Sharing'
        ],
        
        interests: [
          'Cutting-edge ML research and applications',
          'Healthcare technology and medical AI',
          'Autonomous systems and robotics',
          'Open source ML tools and frameworks',
          'AI ethics and responsible deployment'
        ],
        
        workStyle: [
          'Data-driven decision making',
          'Collaborative cross-functional work',
          'Agile development methodologies',
          'Continuous integration and deployment',
          'Code review and knowledge sharing'
        ]
      },
      
      communication: {
        tone: 'Professional yet approachable, technically knowledgeable but not overwhelming',
        approach: 'Focus on mutual value, shared interests, and genuine curiosity about their work',
        
        connectionStrategies: {
          'Healthcare Technology': 'Emphasize ML applications in healthcare, medical imaging experience',
          'Autonomous Systems': 'Highlight computer vision, real-time systems, and safety-critical ML',
          'Fintech': 'Focus on production ML systems, model reliability, and scalable infrastructure',
          'Startups': 'Emphasize end-to-end ML capabilities, rapid prototyping, and growth mindset',
          'Enterprise': 'Highlight MLOps, scalable systems, and cross-functional collaboration',
          'Research': 'Focus on technical depth, publications, and cutting-edge applications'
        }
      }
    };
  }

  getProfile() {
    return this.userProfile;
  }

  getPersonalInfo() {
    return this.userProfile.personalInfo;
  }

  getProfessionalInfo() {
    return this.userProfile.professional;
  }

  getConnectionStrategy(targetCompany, targetRole, targetIndustry) {
    const strategies = this.userProfile.communication.connectionStrategies;
    
    // Determine best strategy based on target context
    if (targetIndustry && strategies[targetIndustry]) {
      return strategies[targetIndustry];
    }
    
    if (targetCompany) {
      const companyLower = targetCompany.toLowerCase();
      if (companyLower.includes('health') || companyLower.includes('medical')) {
        return strategies['Healthcare Technology'];
      }
      if (companyLower.includes('auto') || companyLower.includes('robot')) {
        return strategies['Autonomous Systems'];
      }
      if (companyLower.includes('bank') || companyLower.includes('finance') || companyLower.includes('fintech')) {
        return strategies['Fintech'];
      }
    }
    
    if (targetRole) {
      const roleLower = targetRole.toLowerCase();
      if (roleLower.includes('research') || roleLower.includes('scientist')) {
        return strategies['Research'];
      }
      if (roleLower.includes('startup') || roleLower.includes('founder')) {
        return strategies['Startups'];
      }
    }
    
    return strategies['Enterprise']; // Default strategy
  }

  getRelevantSkills(targetContext) {
    const { professional } = this.userProfile;
    
    // Return skills most relevant to the target context
    if (targetContext?.toLowerCase().includes('vision') || 
        targetContext?.toLowerCase().includes('image')) {
      return ['Computer Vision', 'Deep Learning', 'Image Processing', 'Neural Networks'];
    }
    
    if (targetContext?.toLowerCase().includes('mlops') || 
        targetContext?.toLowerCase().includes('deployment')) {
      return ['MLOps', 'Model Deployment', 'Production ML Systems', 'Docker', 'Kubernetes'];
    }
    
    if (targetContext?.toLowerCase().includes('health') || 
        targetContext?.toLowerCase().includes('medical')) {
      return ['Computer Vision', 'Deep Learning', 'Healthcare Technology', 'Medical Imaging'];
    }
    
    // Return core skills by default
    return professional.coreSkills.slice(0, 6);
  }

  getRelevantAchievements(targetContext) {
    const { professional } = this.userProfile;
    
    // Return achievements most relevant to the target context
    if (targetContext?.toLowerCase().includes('scale') || 
        targetContext?.toLowerCase().includes('production')) {
      return professional.achievements.filter(achievement => 
        achievement.includes('production') || 
        achievement.includes('scale') || 
        achievement.includes('millions')
      );
    }
    
    if (targetContext?.toLowerCase().includes('team') || 
        targetContext?.toLowerCase().includes('lead')) {
      return professional.achievements.filter(achievement => 
        achievement.includes('Led') || 
        achievement.includes('team') || 
        achievement.includes('Mentored')
      );
    }
    
    // Return top achievements by default
    return professional.achievements.slice(0, 2);
  }

  updateProfile(updates) {
    // Allow for profile updates while maintaining structure
    this.userProfile = { ...this.userProfile, ...updates };
  }
}

module.exports = new ProfileService();