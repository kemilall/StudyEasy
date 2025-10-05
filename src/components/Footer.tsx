import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';

export const Footer: React.FC = () => {
  const navigation = useNavigation<any>();

  const footerLinks = [
    { label: 'Centre d\'assistance', href: '/help' },
    { label: 'Confidentialité', href: '/privacy' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <View
      style={{
        backgroundColor: Colors.surfaceAlt,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingVertical: 32,
        paddingHorizontal: 20,
        marginTop: 48,
      }}
      role="contentinfo"
    >
      <View style={{
        maxWidth: 1280,
        alignSelf: 'center',
        width: '100%',
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          {/* Links */}
          <View style={{
            flexDirection: 'row',
            gap: 24,
            flexWrap: 'wrap',
          }}>
            {footerLinks.map((link) => (
              <TouchableOpacity
                key={link.href}
                onPress={() => navigation.navigate(link.href.slice(1))}
                style={{
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    ...Typography.body,
                    color: Colors.textSecondary,
                    fontWeight: '500',
                  }}
                >
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Copyright and note */}
          <View style={{
            alignItems: 'flex-end',
            gap: 8,
          }}>
            <Text
              style={{
                ...Typography.small,
                color: Colors.textSecondary,
                textAlign: 'right',
              }}
            >
              Propulsé par l'IA — confidentialité by design
            </Text>
            <Text
              style={{
                ...Typography.small,
                color: Colors.textSecondary,
                fontWeight: '600',
              }}
            >
              © StudyEasy
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

