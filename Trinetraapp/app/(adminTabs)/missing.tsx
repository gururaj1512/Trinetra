import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Linking, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FirebaseService, { MissingPersonReport } from '../../lib/firebaseService';

const { width } = Dimensions.get('window');

export default function MissingScreen() {
  const [missingPersonReports, setMissingPersonReports] = useState<MissingPersonReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MissingPersonReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState<'finding' | 'found' | 'not found'>('finding');
  const [adminNotes, setAdminNotes] = useState('');
  const [foundAddress, setFoundAddress] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchMissingPersonReports();
  }, []);

  const fetchMissingPersonReports = async () => {
    try {
      const reports = await FirebaseService.getAllMissingPersonReports();
      setMissingPersonReports(reports);
    } catch (error) {
      console.error('Error fetching missing person reports:', error);
      Alert.alert('Error', 'Failed to fetch missing person reports');
    }
  };

  const openStatusModal = (report: MissingPersonReport) => {
    setSelectedReport(report);
    setStatus(report.status);
    setAdminNotes(report.adminNotes || '');
    setFoundAddress(report.foundAddress || '');
    setModalVisible(true);
  };

  const updateReportStatus = async () => {
    if (!selectedReport) return;

    try {
      await FirebaseService.updateMissingPersonReportStatus(
        selectedReport.id!,
        status,
        adminNotes.trim() || undefined,
        foundAddress.trim() || undefined
      );

      Alert.alert('Success', 'Report status updated successfully!');
      setModalVisible(false);
      fetchMissingPersonReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

  const downloadImage = async (imageUrl: string, personName: string) => {
    try {
      const supported = await Linking.canOpenURL(imageUrl);
      if (supported) {
        await Linking.openURL(imageUrl);
      } else {
        Alert.alert('Error', 'Cannot open image URL');
      }
    } catch (error) {
      console.error('Error opening image:', error);
      Alert.alert('Error', 'Failed to open image');
    }
  };

  const callUser = async (phoneNumber: string, userName: string) => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        Alert.alert(
          'Call User',
          `Do you want to call ${userName} at ${phoneNumber}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL(phoneUrl) }
          ]
        );
      } else {
        Alert.alert('Error', 'Phone calling is not supported on this device');
      }
    } catch (error) {
      console.error('Error calling user:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const analyzeWithFaceDetection = (report: MissingPersonReport) => {
    // Navigate to face detection analysis with the missing person's image
    router.push({
      pathname: '/faceDetectionAnalysis',
      params: {
        missingPersonImage: report.missingPersonImageUrl,
        missingPersonName: report.missingPersonName,
        reportId: report.id
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found': return '#28a745';
      case 'not found': return '#dc3545';
      case 'finding': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const renderReport = ({ item }: { item: MissingPersonReport }) => (
    <View style={styles.reportCard}>
      {/* Card Header with Image and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.imageContainer}>
          {item.missingPersonImageUrl ? (
            <Image source={{ uri: item.missingPersonImageUrl }} style={styles.personImage} />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="person" size={32} color="#CCCCCC" />
            </View>
          )}
        </View>
        
        <View style={styles.headerInfo}>
          <View style={styles.personBasicInfo}>
            <Text style={styles.personName}>{item.missingPersonName}</Text>
            <Text style={styles.personAge}>Age: {item.missingPersonAge}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons 
              name={item.status === 'found' ? 'checkmark-circle' : item.status === 'finding' ? 'search' : 'close-circle'} 
              size={12} 
              color="#FFFFFF" 
            />
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Person Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.personDescription}>{item.missingPersonDescription}</Text>
      </View>

      {/* Reporter Information */}
      <View style={styles.reporterInfo}>
        <View style={styles.reporterHeader}>
          <Ionicons name="person-circle" size={16} color="#FF8C00" />
          <Text style={styles.reporterTitle}>Reported by</Text>
        </View>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.userEmail}>{item.userEmail}</Text>
        <View style={styles.phoneContainer}>
          <Text style={styles.userPhone}>{item.userPhone}</Text>
          <TouchableOpacity 
            style={styles.callBtn} 
            onPress={() => callUser(item.userPhone, item.userName)}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Additional Information */}
      {(item.foundAddress || item.adminNotes) && (
        <View style={styles.additionalInfo}>
          {item.foundAddress && (
            <View style={styles.foundInfo}>
              <View style={styles.foundHeader}>
                <Ionicons name="location" size={14} color="#4CAF50" />
                <Text style={styles.foundTitle}>Found Location</Text>
              </View>
              <Text style={styles.foundAddress}>{item.foundAddress}</Text>
            </View>
          )}
          
          {item.adminNotes && (
            <View style={styles.notesInfo}>
              <View style={styles.notesHeader}>
                <Ionicons name="document-text" size={14} color="#FF8C00" />
                <Text style={styles.notesTitle}>Admin Notes</Text>
              </View>
              <Text style={styles.adminNotes}>{item.adminNotes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.downloadBtn} 
          onPress={() => item.missingPersonImageUrl && downloadImage(item.missingPersonImageUrl, item.missingPersonName)}
        >
          <Ionicons name="download" size={16} color="#FF8C00" />
          <Text style={styles.downloadBtnText}>Download</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.analyzeBtn} 
          onPress={() => analyzeWithFaceDetection(item)}
        >
          <Ionicons name="search" size={16} color="#FFFFFF" />
          <Text style={styles.analyzeBtnText}>Analyze</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.updateStatusBtn} 
          onPress={() => openStatusModal(item)}
        >
          <Ionicons name="create" size={16} color="#FFFFFF" />
          <Text style={styles.updateStatusBtnText}>Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>Missing Person Management</Text>
                <Text style={styles.subtitle}>AI-powered search and rescue system</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* KPI Summary Cards */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="people" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiNumber}>{missingPersonReports.length}</Text>
            <Text style={styles.kpiLabel}>Total Reports</Text>
          </View>
          
          <View style={[styles.kpiCard, styles.kpiCardSecondary]}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiNumber}>
              {missingPersonReports.filter(r => r.status === 'finding').length}
            </Text>
            <Text style={styles.kpiLabel}>Searching</Text>
          </View>
          
          <View style={[styles.kpiCard, styles.kpiCardTertiary]}>
            <View style={styles.kpiIconContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiNumber}>
              {missingPersonReports.filter(r => r.status === 'found').length}
            </Text>
            <Text style={styles.kpiLabel}>Found</Text>
          </View>
        </View>

        {/* Enhanced Active Cases Section */}
        <View style={styles.reportsSection}>
          {/* Professional Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="list" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.sectionTitleTextContainer}>
                <Text style={styles.sectionTitle}>Active Cases</Text>
                <Text style={styles.sectionSubtitle}>Real-time missing person investigations</Text>
              </View>
            </View>
            <View style={styles.casesCount}>
              <Text style={styles.casesCountText}>{missingPersonReports.length}</Text>
              <Text style={styles.casesCountLabel}>cases</Text>
            </View>
          </View>


          {/* Case Filter Tabs */}
          <View style={styles.filterTabsContainer}>
            <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
              <Ionicons name="list" size={16} color="#FF8C00" />
              <Text style={styles.filterTabTextActive}>All Cases</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <Ionicons name="search" size={16} color="#666666" />
              <Text style={styles.filterTabText}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <Ionicons name="checkmark" size={16} color="#666666" />
              <Text style={styles.filterTabText}>Resolved</Text>
            </TouchableOpacity>
          </View>
          
          {/* Cases List */}
          {missingPersonReports.length > 0 ? (
            <View style={styles.casesListContainer}>
              {missingPersonReports.map((item, index) => (
                <View key={item.id} style={styles.caseCardWrapper}>
                  <View style={styles.caseNumberBadge}>
                    <Text style={styles.caseNumberText}>#{index + 1}</Text>
                  </View>
                  {renderReport({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search" size={48} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyTitle}>No Missing Person Reports</Text>
              <Text style={styles.emptyText}>All cases have been resolved or no new reports have been submitted.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Report Status</Text>
            
            <Text style={styles.modalSubtitle}>Missing Person: {selectedReport?.missingPersonName}</Text>
            
            <View style={styles.statusContainer}>
              <Text style={styles.label}>Status:</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity 
                  style={[styles.statusBtn, status === 'finding' && styles.statusBtnActive]} 
                  onPress={() => setStatus('finding')}
                >
                  <Text style={[styles.statusBtnText, status === 'finding' && styles.statusBtnTextActive]}>
                    Finding
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.statusBtn, status === 'not found' && styles.statusBtnActive]} 
                  onPress={() => setStatus('not found')}
                >
                  <Text style={[styles.statusBtnText, status === 'not found' && styles.statusBtnTextActive]}>
                    Not Found
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.statusBtn, status === 'found' && styles.statusBtnActive]} 
                  onPress={() => setStatus('found')}
                >
                  <Text style={[styles.statusBtnText, status === 'found' && styles.statusBtnTextActive]}>
                    Found
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Admin Notes (optional)"
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={3}
            />

            {status === 'found' && (
              <TextInput
                style={styles.input}
                placeholder="Found Address *"
                value={foundAddress}
                onChangeText={setFoundAddress}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.updateBtn} 
                onPress={updateReportStatus}
              >
                <Text style={styles.updateBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#FF8C00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop:5,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
  },
  kpiCardPrimary: {
    backgroundColor: '#007BFF',
  },
  kpiCardSecondary: {
    backgroundColor: '#FF8C00',
  },
  kpiCardTertiary: {
    backgroundColor: '#4CAF50',
  },
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  reportsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  casesCount: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  casesCountText: {
    fontSize: 20,
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  casesCountLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  filterTabTextActive: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  casesListContainer: {
    gap: 16,
  },
  caseCardWrapper: {
    position: 'relative',
  },
  caseNumberBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    zIndex: 10,
    backgroundColor: '#FF8C00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  caseNumberText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  imageContainer: {
    marginRight: 16,
  },
  personImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  noImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  personBasicInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  personAge: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  descriptionContainer: {
    padding: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  personDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  reporterInfo: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reporterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reporterTitle: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: '600',
    marginLeft: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userPhone: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  callBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  additionalInfo: {
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  foundInfo: {
    marginBottom: 12,
  },
  foundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  foundTitle: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  foundAddress: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  notesInfo: {
    marginBottom: 0,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notesTitle: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: '600',
    marginLeft: 6,
  },
  adminNotes: {
    fontSize: 14,
    color: '#333333',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 6,
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  downloadBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  analyzeBtn: {
    flex: 1,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  updateStatusBtn: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  updateStatusBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  statusContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  statusBtnActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    textAlignVertical: 'top',
    height: 80,
    fontSize: 14,
    color: '#333333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 14,
    color: '#333333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6C757D',
    alignItems: 'center',
    shadowColor: '#6C757D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  updateBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
